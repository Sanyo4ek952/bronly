import { cache } from "react";

import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import { aggregateRoomAmenities, resolvePublicPropertyDetailMode } from "@/entities/property/model/public-property";
import { property as mockProperty } from "@/entities/property/model/mock";
import type {
  OwnerPublicProfile,
  PublicPropertyPageData,
  PublicPropertySection,
  PublicPropertySummary,
} from "@/entities/property/model/types";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room";
import { rooms as mockRooms } from "@/entities/room/model/mock";
import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom, RoomPhoto } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getDemoPropertySlug } from "@/shared/api/supabase/env";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";
import type {
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

type PublicOwnerRow = {
  id: string;
  slug: string;
  display_name: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  is_public_hidden_by_admin: boolean;
};

type OwnerPublicSlugResolution = {
  ownerSlug: string;
  matchedPropertySlug: string | null;
  shouldRedirect: boolean;
};

function normalizePublicSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function mapPublicOwner(row: PublicOwnerRow): OwnerPublicProfile {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    telegram: row.telegram ?? "",
  };
}

function mapPublicProperty(row: SupabasePropertyRow, photos: PublicPropertySummary["photos"], features: string[], houseRules: string[]) {
  return {
    id: row.id,
    title: row.title,
    shortTitle: row.short_title,
    slug: row.slug,
    propertyType: row.property_type,
    detailMode: resolvePublicPropertyDetailMode(row.property_type),
    city: row.city,
    address: row.address,
    timezone: row.timezone,
    shortDescription: row.short_description ?? "",
    fullDescription: row.full_description ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    telegram: row.telegram ?? "",
    checkInTime: row.check_in_time ?? "",
    checkOutTime: row.check_out_time ?? "",
    photos,
    features,
    aggregatedAmenities: [],
    houseRules,
  } satisfies PublicPropertySummary;
}

function mapRoomRow(
  room: SupabaseRoomRow,
  photos: RoomPhoto[],
  amenities: string[],
  seasonalPrices: OwnerSeasonalPrice[],
  busyRanges: OwnerBusyRange[],
): PublicRoom {
  return {
    id: room.id,
    ownerId: room.owner_id,
    kind: room.room_kind,
    title: room.title,
    subtitle: room.subtitle ?? "",
    propertySlug: null,
    capacity: room.capacity,
    bedrooms: room.bedrooms,
    area: room.area,
    pricePerNight: Number(room.price_per_night),
    status: room.is_active ? "active" : "inactive",
    photos,
    amenities,
    seasonalPrices,
    busyRanges,
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

function toPublicFallbackData(filters: PublicStayFilters): PublicPropertyPageData {
  return {
    owner: {
      id: mockProperty.id,
      slug: mockProperty.slug,
      displayName: mockProperty.title,
      phone: mockProperty.phone,
      whatsapp: mockProperty.whatsapp,
      telegram: mockProperty.telegram,
    },
    properties: [
      {
        property: {
          id: mockProperty.id,
          title: mockProperty.title,
          shortTitle: mockProperty.shortTitle,
          slug: mockProperty.slug,
          propertyType: mockProperty.propertyType,
          detailMode: resolvePublicPropertyDetailMode(mockProperty.propertyType),
          city: mockProperty.city,
          address: mockProperty.address,
          timezone: mockProperty.timezone,
          shortDescription: mockProperty.shortDescription,
          fullDescription: mockProperty.fullDescription,
          phone: mockProperty.phone,
          whatsapp: mockProperty.whatsapp,
          telegram: mockProperty.telegram,
          checkInTime: mockProperty.checkInTime,
          checkOutTime: mockProperty.checkOutTime,
          photos: mockProperty.photos,
          features: mockProperty.features,
          aggregatedAmenities: aggregateRoomAmenities(mockRooms),
          houseRules: mockProperty.houseRules,
        },
        rooms: mockRooms
          .map((room) =>
            buildPublicRoomQuote(
              {
                id: room.id,
                title: room.title,
                subtitle: room.subtitle,
                capacity: room.capacity,
                bedrooms: room.bedrooms,
                area: room.area,
                pricePerNight: room.pricePerNight,
                status: room.status,
                photos: room.photos,
                amenities: room.amenities,
                seasonalPrices: [],
                busyRanges: [],
              },
              filters,
            ),
          )
          .sort((a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter))),
      },
    ],
    standaloneRooms: [],
    filters,
    publicUnavailableReason: null,
    publicWarningText: null,
  };
}

function buildUnavailablePageData(
  filters: PublicStayFilters,
  reason: PublicUnavailableReason,
): PublicPropertyPageData {
  return {
    owner: null,
    properties: [],
    standaloneRooms: [],
    filters,
    publicUnavailableReason: reason,
    publicWarningText: null,
  };
}

export function getOwnerPropertySectionBySlug(pageData: PublicPropertyPageData, propertySlug: string) {
  return pageData.properties.find((section) => section.property.slug === propertySlug) ?? null;
}

export const resolveOwnerPublicSlug = cache(async (slug: string): Promise<OwnerPublicSlugResolution | null> => {
  const normalizedSlug = normalizePublicSlug(slug);

  if (!canUseSupabase()) {
    return normalizedSlug === getDemoPropertySlug()
      ? {
          ownerSlug: normalizedSlug,
          matchedPropertySlug: null,
          shouldRedirect: false,
        }
      : null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: ownerData } = await supabase.from("profiles").select("slug").eq("slug", normalizedSlug).maybeSingle();

    if (ownerData?.slug) {
      return {
        ownerSlug: ownerData.slug as string,
        matchedPropertySlug: null,
        shouldRedirect: ownerData.slug !== normalizedSlug,
      };
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("slug, owner_id")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    const propertyRow = (propertyData ?? null) as Pick<SupabasePropertyRow, "slug" | "owner_id"> | null;

    if (!propertyRow) {
      return null;
    }

    const { data: profileData } = await supabase.from("profiles").select("slug").eq("id", propertyRow.owner_id).maybeSingle();
    const ownerSlug = (profileData?.slug as string | undefined) ?? "";

    if (!ownerSlug) {
      return null;
    }

    return {
      ownerSlug,
      matchedPropertySlug: propertyRow.slug,
      shouldRedirect: ownerSlug !== normalizedSlug,
    };
  } catch {
    return null;
  }
});

export const getPublicPropertyPageData = cache(
  async (
    slug: string,
    filterInput: {
      checkIn?: string;
      checkOut?: string;
      adults?: string | number;
      rooms?: string | number;
    } = {},
  ): Promise<PublicPropertyPageData | null> => {
    const normalizedSlug = normalizePublicSlug(slug);
    const filters = normalizePublicStayFilters(filterInput);

    if (!canUseSupabase()) {
      return normalizedSlug === getDemoPropertySlug() ? toPublicFallbackData(filters) : null;
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, slug, display_name, phone, whatsapp, telegram, is_public_hidden_by_admin")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      const ownerRow = (ownerData ?? null) as PublicOwnerRow | null;

      if (!ownerRow) {
        return null;
      }

      const subscription = await getSubscriptionRuntimeState(ownerRow.id, "owner");

      if (!subscription.isPublicAllowed) {
        return buildUnavailablePageData(filters, "subscription_expired");
      }

      if (ownerRow.is_public_hidden_by_admin) {
        return buildUnavailablePageData(filters, "admin_hidden");
      }

      const { data: propertyRows } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", ownerRow.id)
        .eq("published", true)
        .eq("is_frozen", false)
        .order("created_at", { ascending: true });

      const safePropertyRows = (propertyRows ?? []) as SupabasePropertyRow[];

      if (!safePropertyRows.length) {
        return {
          owner: mapPublicOwner(ownerRow),
          properties: [],
          standaloneRooms: [],
          filters,
          publicUnavailableReason: null,
          publicWarningText: subscription.publicWarningText,
        };
      }

      const propertyIds = safePropertyRows.map((property) => property.id);
      const [{ data: roomRows }, { data: featureRows }, { data: ruleRows }, { data: propertyPhotoRows }] = await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .in("property_id", propertyIds)
          .eq("is_active", true)
          .order("title", { ascending: true }),
        supabase
          .from("property_features")
          .select("property_id, label, sort_order")
          .in("property_id", propertyIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("property_rules")
          .select("property_id, label, sort_order")
          .in("property_id", propertyIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("property_photos")
          .select("*")
          .in("property_id", propertyIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      const { data: standaloneRoomRows } = await supabase
        .from("rooms")
        .select("*")
        .eq("owner_id", ownerRow.id)
        .eq("room_kind", "standalone_room")
        .eq("is_active", true)
        .order("title", { ascending: true });

      const safeRoomRows = (roomRows ?? []) as SupabaseRoomRow[];
      const safeStandaloneRoomRows = (standaloneRoomRows ?? []) as SupabaseRoomRow[];
      const roomIds = [...safeRoomRows, ...safeStandaloneRoomRows].map((room) => room.id);
      const [amenitiesResult, seasonalResult, busyResult, roomPhotosResult] = roomIds.length
        ? await Promise.all([
            supabase
              .from("room_amenities")
              .select("room_id, label, sort_order")
              .in("room_id", roomIds)
              .order("sort_order", { ascending: true }),
            supabase
              .from("room_seasonal_prices")
              .select("*")
              .in("room_id", roomIds)
              .eq("is_active", true)
              .order("starts_on", { ascending: true }),
            supabase
              .from("room_busy_ranges")
              .select("*")
              .in("room_id", roomIds)
              .order("starts_on", { ascending: true }),
            supabase
              .from("room_photos")
              .select("*")
              .in("room_id", roomIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true }),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

      const featureMap = new Map<string, string[]>();
      const ruleMap = new Map<string, string[]>();
      const amenityMap = new Map<string, string[]>();
      const seasonalMap = new Map<string, OwnerSeasonalPrice[]>();
      const busyMap = new Map<string, OwnerBusyRange[]>();

      for (const item of featureRows ?? []) {
        const current = featureMap.get(item.property_id as string) ?? [];
        current.push(item.label as string);
        featureMap.set(item.property_id as string, current);
      }

      for (const item of ruleRows ?? []) {
        const current = ruleMap.get(item.property_id as string) ?? [];
        current.push(item.label as string);
        ruleMap.set(item.property_id as string, current);
      }

      for (const item of amenitiesResult.data ?? []) {
        const current = amenityMap.get(item.room_id as string) ?? [];
        current.push(item.label as string);
        amenityMap.set(item.room_id as string, current);
      }

      for (const item of (seasonalResult.data ?? []) as SupabaseRoomSeasonalPriceRow[]) {
        const current = seasonalMap.get(item.room_id) ?? [];
        current.push(mapSeasonalPrice(item));
        seasonalMap.set(item.room_id, current);
      }

      for (const item of (busyResult.data ?? []) as SupabaseRoomBusyRangeRow[]) {
        const current = busyMap.get(item.room_id) ?? [];
        current.push(mapBusyRange(item));
        busyMap.set(item.room_id, current);
      }

      const propertyPhotoMap = buildPropertyPhotoMap((propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[]);
      const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);
      const roomsByProperty = new Map<string, PublicRoom[]>();

      for (const room of safeRoomRows) {
        const publicRoom = buildPublicRoomQuote(
          mapRoomRow(
            room,
            roomPhotoMap.get(room.id) ?? [],
            amenityMap.get(room.id) ?? [],
            seasonalMap.get(room.id) ?? [],
            busyMap.get(room.id) ?? [],
          ),
          filters,
        );
        if (!room.property_id) {
          continue;
        }
        publicRoom.propertySlug = safePropertyRows.find((item) => item.id === room.property_id)?.slug ?? null;
        const current = roomsByProperty.get(room.property_id) ?? [];
        current.push(publicRoom);
        roomsByProperty.set(room.property_id, current);
      }

      const standaloneRooms = safeStandaloneRoomRows
        .map((room) =>
          buildPublicRoomQuote(
            mapRoomRow(
              room,
              roomPhotoMap.get(room.id) ?? [],
              amenityMap.get(room.id) ?? [],
              seasonalMap.get(room.id) ?? [],
              busyMap.get(room.id) ?? [],
            ),
            filters,
          ),
        )
        .sort((a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)));

      const properties: PublicPropertySection[] = safePropertyRows.map((property) => {
        const photos = withLegacyPropertyCover(propertyPhotoMap.get(property.id) ?? [], property.cover_image_url);
        const propertyRooms = (roomsByProperty.get(property.id) ?? []).sort(
          (a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)),
        );

        return {
          property: {
            ...mapPublicProperty(property, photos, featureMap.get(property.id) ?? [], ruleMap.get(property.id) ?? []),
            aggregatedAmenities: aggregateRoomAmenities(propertyRooms),
          },
          rooms: propertyRooms,
        };
      });

      return {
        owner: mapPublicOwner(ownerRow),
        properties,
        standaloneRooms,
        filters,
        publicUnavailableReason: null,
        publicWarningText: subscription.publicWarningText,
      };
    } catch {
      return null;
    }
  },
);
