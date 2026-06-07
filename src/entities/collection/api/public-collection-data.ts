import { cache } from "react";

import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicRoom, type PublicStayFilters } from "@/entities/room";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerBusyRange, OwnerSeasonalPrice, RoomPhoto } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";
import type {
  SupabaseCollectionRow,
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

import type {
  CollectionRole,
  PublicCollectionContact,
  PublicCollectionPageData,
  PublicCollectionSection,
  PublicCollectionStandaloneRoomItem,
} from "../model/types";

type CollectionRoomRow = SupabaseRoomRow & {
  properties:
    | {
        id: string;
        slug: string;
        title: string;
        short_title: string;
        city: string;
        address: string;
        owner_id: string;
        cover_image_url?: string | null;
      }
    | Array<{
        id: string;
        slug: string;
        title: string;
        short_title: string;
        city: string;
        address: string;
        owner_id: string;
        cover_image_url?: string | null;
      }>
    | null;
};

type CollectionItemRow = {
  property_id: string | null;
  room_id: string | null;
};

type CollectionContext = {
  collection: PublicCollectionPageData["collection"];
  contact: PublicCollectionContact | null;
  sections: PublicCollectionSection[];
  standaloneRooms: PublicCollectionStandaloneRoomItem[];
  publicWarningText: string | null;
  publicUnavailableReason: PublicUnavailableReason | null;
} | null;

function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapRoomRow(
  room: SupabaseRoomRow,
  photos: RoomPhoto[],
  seasonalPrices: OwnerSeasonalPrice[],
  busyRanges: OwnerBusyRange[],
  agentMarkupPercent: number,
): PublicRoom {
  return {
    id: room.id,
    ownerId: room.owner_id,
    kind: room.room_kind,
    title: room.title,
    subtitle: room.subtitle ?? "",
    propertyTitle: room.property_id ? undefined : room.property_type ?? "Отдельный номер",
    capacity: room.capacity,
    bedrooms: room.bedrooms,
    area: room.area,
    pricePerNight: Number(room.price_per_night),
    status: room.is_active ? "active" : "inactive",
    photos,
    amenities: [],
    seasonalPrices,
    busyRanges,
    agentMarkupPercent,
    location: {
      propertyId: room.property_id,
      propertyType: room.property_type ?? "",
      city: room.city ?? "",
      address: room.address ?? "",
      timezone: room.timezone ?? "",
      shortDescription: room.short_description ?? "",
      fullDescription: room.full_description ?? "",
      phone: room.phone ?? "",
      whatsapp: room.whatsapp ?? "",
      telegram: room.telegram ?? "",
      checkInTime: room.check_in_time ?? "",
      checkOutTime: room.check_out_time ?? "",
      allowAgentInquiries: room.allow_agent_inquiries,
      allowOwnerContactSharing: room.allow_owner_contact_sharing,
    },
  };
}

async function loadPublicCollectionContext(
  slug: string,
  filters: PublicStayFilters,
): Promise<CollectionContext> {
  if (!canUseSupabase()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: collectionData } = await supabase.from("collections").select("*").eq("slug", slug).maybeSingle();
  const collectionRow = collectionData as SupabaseCollectionRow | null;

  if (!collectionRow || collectionRow.is_archived) {
    return null;
  }

  const [{ data: creatorVisibilityData }, creatorSubscription] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_public_hidden_by_admin")
      .eq("id", collectionRow.creator_id)
      .maybeSingle(),
    getSubscriptionRuntimeState(collectionRow.creator_id, collectionRow.creator_role),
  ]);

  if (!creatorSubscription.isPublicAllowed) {
    return {
      collection: null,
      contact: null,
      sections: [],
      standaloneRooms: [],
      publicWarningText: null,
      publicUnavailableReason: "subscription_expired",
    };
  }

  if (creatorVisibilityData?.is_public_hidden_by_admin) {
    return {
      collection: null,
      contact: null,
      sections: [],
      standaloneRooms: [],
      publicWarningText: null,
      publicUnavailableReason: "admin_hidden",
    };
  }

  const [{ data: creatorData }, { data: itemRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, slug, display_name, phone, whatsapp, telegram")
      .eq("id", collectionRow.creator_id)
      .maybeSingle(),
    supabase
      .from("collection_items")
      .select("property_id, room_id")
      .eq("collection_id", collectionRow.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const creator = creatorData as {
    id: string;
    slug: string | null;
    display_name: string;
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
  } | null;

  if (!creator) {
    return null;
  }

  const safeItemRows = (itemRows ?? []) as CollectionItemRow[];
  const propertyIds = [...new Set(safeItemRows.map((item) => item.property_id).filter((value): value is string => Boolean(value)))];
  const directRoomIds = [...new Set(safeItemRows.map((item) => item.room_id).filter((value): value is string => Boolean(value)))];

  const propertyRowsResult = propertyIds.length
    ? await supabase
        .from("properties")
        .select("id, owner_id, slug, title, short_title, city, address, cover_image_url, published, is_frozen")
        .in("id", propertyIds)
        .eq("published", true)
        .eq("is_frozen", false)
    : { data: [] };
  const directRoomRowsResult = directRoomIds.length
    ? await supabase
        .from("rooms")
        .select("*, properties(id, slug, title, short_title, city, address, owner_id, cover_image_url)")
        .in("id", directRoomIds)
        .eq("is_active", true)
        .order("title", { ascending: true })
    : { data: [] };

  const directRoomPropertyIds = [
    ...new Set(
      ((directRoomRowsResult.data ?? []) as CollectionRoomRow[])
        .map((row) => getSingleRow(row.properties)?.id ?? "")
        .filter(Boolean),
    ),
  ];
  const extraPropertyIds = directRoomPropertyIds.filter((propertyId) => !propertyIds.includes(propertyId));
  const extraPropertyRowsResult = extraPropertyIds.length
    ? await supabase
        .from("properties")
        .select("id, owner_id, slug, title, short_title, city, address, cover_image_url, published, is_frozen")
        .in("id", extraPropertyIds)
        .eq("published", true)
        .eq("is_frozen", false)
    : { data: [] };

  const propertyRows = [...(propertyRowsResult.data ?? []), ...(extraPropertyRowsResult.data ?? [])] as Array<
    Pick<
      SupabasePropertyRow,
      "id" | "owner_id" | "slug" | "title" | "short_title" | "city" | "address" | "cover_image_url" | "published" | "is_frozen"
    >
  >;
  const ownerStates = await Promise.all(
    [
      ...new Set([
        ...propertyRows.map((property) => property.owner_id),
        ...((directRoomRowsResult.data ?? []) as CollectionRoomRow[]).map((room) => room.owner_id),
      ]),
    ].map(async (ownerId) => [ownerId, await getSubscriptionRuntimeState(ownerId, "owner")] as const),
  );
  const ownerStateMap = new Map(ownerStates);
  const safePropertyMap = new Map(
    propertyRows
      .filter((property) => ownerStateMap.get(property.owner_id)?.isPublicAllowed)
      .map((property) => [property.id, property]),
  );

  const propertyRoomRowsResult = safePropertyMap.size
    ? await supabase
        .from("rooms")
        .select("*, properties!inner(id, slug, title, short_title, city, address, owner_id, cover_image_url)")
        .in("property_id", [...safePropertyMap.keys()])
        .eq("is_active", true)
        .order("title", { ascending: true })
    : { data: [] };

  const propertyRoomMap = new Map<string, CollectionRoomRow>();
  const standaloneRoomMap = new Map<string, CollectionRoomRow>();

  for (const row of [
    ...((propertyRoomRowsResult.data ?? []) as CollectionRoomRow[]),
    ...((directRoomRowsResult.data ?? []) as CollectionRoomRow[]),
  ]) {
    const property = getSingleRow(row.properties);

    if (row.room_kind === "standalone_room") {
      if (ownerStateMap.get(row.owner_id)?.isPublicAllowed) {
        standaloneRoomMap.set(row.id, row);
      }
      continue;
    }

    if (!property || !safePropertyMap.has(property.id)) {
      continue;
    }

    propertyRoomMap.set(row.id, row);
  }

  const roomIds = [...propertyRoomMap.keys(), ...standaloneRoomMap.keys()];
  const propertyPhotoIds = [...safePropertyMap.keys()];
  const [seasonalResult, busyResult, markupResult, roomPhotosResult, propertyPhotosResult] = roomIds.length
    ? await Promise.all([
        supabase
          .from("room_seasonal_prices")
          .select("*")
          .in("room_id", roomIds)
          .eq("is_active", true)
          .order("starts_on", { ascending: true }),
        supabase.from("room_busy_ranges").select("*").in("room_id", roomIds).order("starts_on", { ascending: true }),
        collectionRow.creator_role === "agent"
          ? supabase
              .from("room_agent_markups")
              .select("room_id, markup_percent")
              .eq("agent_id", collectionRow.creator_id)
              .in("room_id", roomIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from("room_photos")
          .select("*")
          .in("room_id", roomIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        propertyPhotoIds.length
          ? supabase
              .from("property_photos")
              .select("*")
              .in("property_id", propertyPhotoIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const seasonalMap = new Map<string, OwnerSeasonalPrice[]>();
  const busyMap = new Map<string, OwnerBusyRange[]>();
  const markupMap = new Map<string, number>();

  for (const item of (seasonalResult.data ?? []) as SupabaseRoomSeasonalPriceRow[]) {
    const existing = seasonalMap.get(item.room_id) ?? [];
    existing.push(mapSeasonalPrice(item));
    seasonalMap.set(item.room_id, existing);
  }

  for (const item of (busyResult.data ?? []) as SupabaseRoomBusyRangeRow[]) {
    const existing = busyMap.get(item.room_id) ?? [];
    existing.push(mapBusyRange(item));
    busyMap.set(item.room_id, existing);
  }

  for (const item of markupResult.data ?? []) {
    markupMap.set(item.room_id as string, Number(item.markup_percent ?? 0));
  }

  const propertyPhotoMap = buildPropertyPhotoMap((propertyPhotosResult.data ?? []) as SupabasePropertyPhotoRow[]);
  const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);
  const roomsByProperty = new Map<string, Map<string, PublicRoom>>();
  const sourceKindsByProperty = new Map<string, Set<"property" | "room">>();
  const standaloneRooms = new Map<string, PublicCollectionStandaloneRoomItem>();

  for (const item of safeItemRows) {
    if (item.property_id) {
      const property = safePropertyMap.get(item.property_id);

      if (!property) {
        continue;
      }

      sourceKindsByProperty.set(property.id, new Set([...(sourceKindsByProperty.get(property.id) ?? []), "property"]));

      for (const room of propertyRoomMap.values()) {
        if (room.property_id !== property.id) {
          continue;
        }

        const scopedRooms = roomsByProperty.get(property.id) ?? new Map<string, PublicRoom>();
        scopedRooms.set(
          room.id,
          buildPublicRoomQuote(
            mapRoomRow(
              room,
              roomPhotoMap.get(room.id) ?? [],
              seasonalMap.get(room.id) ?? [],
              busyMap.get(room.id) ?? [],
              markupMap.get(room.id) ?? 0,
            ),
            filters,
          ),
        );
        roomsByProperty.set(property.id, scopedRooms);
      }
    }

    if (!item.room_id) {
      continue;
    }

    const standaloneRoom = standaloneRoomMap.get(item.room_id);

    if (standaloneRoom) {
      const existing = standaloneRooms.get(standaloneRoom.id);
      standaloneRooms.set(standaloneRoom.id, {
        room: buildPublicRoomQuote(
          mapRoomRow(
            standaloneRoom,
            roomPhotoMap.get(standaloneRoom.id) ?? [],
            seasonalMap.get(standaloneRoom.id) ?? [],
            busyMap.get(standaloneRoom.id) ?? [],
            markupMap.get(standaloneRoom.id) ?? 0,
          ),
          filters,
        ),
        sourceKinds: [...new Set<"property" | "room">([...(existing?.sourceKinds ?? []), "room"])],
      });
      continue;
    }

    const room = propertyRoomMap.get(item.room_id);
    const property = room ? getSingleRow(room.properties) : null;

    if (!room || !property) {
      continue;
    }

    sourceKindsByProperty.set(property.id, new Set([...(sourceKindsByProperty.get(property.id) ?? []), "room"]));

    const scopedRooms = roomsByProperty.get(property.id) ?? new Map<string, PublicRoom>();
    scopedRooms.set(
      room.id,
      buildPublicRoomQuote(
        mapRoomRow(
          room,
          roomPhotoMap.get(room.id) ?? [],
          seasonalMap.get(room.id) ?? [],
          busyMap.get(room.id) ?? [],
          markupMap.get(room.id) ?? 0,
        ),
        filters,
      ),
    );
    roomsByProperty.set(property.id, scopedRooms);
  }

  const sections: PublicCollectionSection[] = [...roomsByProperty.entries()]
    .map(([propertyId, scopedRooms]) => {
      const property = safePropertyMap.get(propertyId);

      if (!property) {
        return null;
      }

      return {
        property: {
          id: property.id,
          slug: property.slug,
          title: property.title,
          shortTitle: property.short_title,
          city: property.city,
          address: property.address,
          photos: withLegacyPropertyCover(propertyPhotoMap.get(property.id) ?? [], property.cover_image_url),
        },
        rooms: [...scopedRooms.values()].sort(
          (a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)),
        ),
        sourceKinds: [...(sourceKindsByProperty.get(property.id) ?? new Set<"property" | "room">())],
      };
    })
    .filter((item): item is PublicCollectionSection => Boolean(item))
    .sort((a, b) => a.property.shortTitle.localeCompare(b.property.shortTitle, "ru"));

  return {
    collection: {
      id: collectionRow.id,
      slug: collectionRow.slug,
      title: collectionRow.title,
      guestLabel: collectionRow.guest_label ?? "",
      creatorRole: collectionRow.creator_role as CollectionRole,
    },
    contact: {
      role: collectionRow.creator_role as CollectionRole,
      id: creator.id,
      slug: creator.slug ?? "",
      displayName: creator.display_name,
      phone: creator.phone ?? "",
      whatsapp: creator.whatsapp ?? "",
      telegram: creator.telegram ?? "",
    },
    sections,
    standaloneRooms: [...standaloneRooms.values()].sort(
      (a, b) => Number(Boolean(b.room.isAvailableForFilter)) - Number(Boolean(a.room.isAvailableForFilter)),
    ),
    publicWarningText: creatorSubscription.publicWarningText,
    publicUnavailableReason: null,
  };
}

export const getPublicCollectionPageData = cache(
  async (
    slug: string,
    filterInput: {
      checkIn?: string;
      checkOut?: string;
      adults?: string | number;
      rooms?: string | number;
    } = {},
  ): Promise<PublicCollectionPageData | null> => {
    const filters = normalizePublicStayFilters(filterInput);

    if (!canUseSupabase()) {
      return null;
    }

    try {
      const context = await loadPublicCollectionContext(slug, filters);

      if (!context) {
        return null;
      }

      if (!context.collection || !context.contact) {
        return {
          collection: null,
          contact: null,
          sections: [],
          standaloneRooms: [],
          filters,
          publicUnavailableReason: context.publicUnavailableReason,
          publicWarningText: null,
        };
      }

      return {
        collection: context.collection,
        contact: context.contact,
        sections: context.sections,
        standaloneRooms: context.standaloneRooms,
        filters,
        publicUnavailableReason: context.publicUnavailableReason,
        publicWarningText: context.publicWarningText,
      };
    } catch {
      return null;
    }
  },
);

export async function recordPublicCollectionOpen(collectionSlug: string) {
  if (!canUseSupabase()) {
    return false;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("collections")
      .select("id, creator_id, creator_role, is_archived, views_count, first_opened_at")
      .eq("slug", collectionSlug)
      .maybeSingle();
    const collection = (data ?? null) as Pick<
      SupabaseCollectionRow,
      "id" | "creator_id" | "creator_role" | "is_archived" | "views_count" | "first_opened_at"
    > | null;

    if (!collection || collection.is_archived) {
      return false;
    }

    const [{ data: creatorVisibilityData }, creatorSubscription] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_public_hidden_by_admin")
        .eq("id", collection.creator_id)
        .maybeSingle(),
      getSubscriptionRuntimeState(collection.creator_id, collection.creator_role),
    ]);

    if (!creatorSubscription.isPublicAllowed || creatorVisibilityData?.is_public_hidden_by_admin) {
      return false;
    }

    const openedAt = new Date().toISOString();
    const { error } = await supabase
      .from("collections")
      .update({
        views_count: collection.views_count + 1,
        first_opened_at: collection.first_opened_at ?? openedAt,
        last_opened_at: openedAt,
      })
      .eq("id", collection.id);

    return !error;
  } catch {
    return false;
  }
}

export async function getCollectionRequestContext(collectionSlug: string, propertySlug: string | undefined, roomId: string) {
  const pageData = await getPublicCollectionPageData(collectionSlug);

  if (!pageData?.collection || !pageData.contact) {
    return null;
  }

  const standaloneRoom = pageData.standaloneRooms.find((item) => item.room.id === roomId)?.room;

  if (standaloneRoom) {
    return {
      collectionId: pageData.collection.id,
      collectionSlug: pageData.collection.slug,
      collectionTitle: pageData.collection.title,
      creatorRole: pageData.collection.creatorRole,
      contactId: pageData.contact.id,
      propertySlug: null,
      roomId: standaloneRoom.id,
      agentProfileId: pageData.collection.creatorRole === "agent" ? pageData.contact.id : null,
      agentMarkupPercent: pageData.collection.creatorRole === "agent" ? standaloneRoom.agentMarkupPercent ?? 0 : null,
    };
  }

  if (!propertySlug) {
    return null;
  }

  const propertySection = pageData.sections.find((section) => section.property.slug === propertySlug);
  const room = propertySection?.rooms.find((item) => item.id === roomId);

  if (!propertySection || !room) {
    return null;
  }

  return {
    collectionId: pageData.collection.id,
    collectionSlug: pageData.collection.slug,
    collectionTitle: pageData.collection.title,
    creatorRole: pageData.collection.creatorRole,
    contactId: pageData.contact.id,
    propertySlug: propertySection.property.slug,
    roomId: room.id,
    agentProfileId: pageData.collection.creatorRole === "agent" ? pageData.contact.id : null,
    agentMarkupPercent: pageData.collection.creatorRole === "agent" ? room.agentMarkupPercent ?? 0 : null,
  };
}
