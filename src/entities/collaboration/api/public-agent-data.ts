import { cache } from "react";

import type { PublicAgentPageData, PublicAgentPropertySection } from "@/entities/collaboration/model/types";
import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import { aggregateRoomAmenities, resolvePublicPropertyDetailMode } from "@/entities/property/model/public-property";
import { buildPublicRoomQuote, normalizePublicStayFilters } from "@/entities/room";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom, RoomPhoto } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
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

type ResolvedAgentProfile = {
  id: string;
  slug: string;
  agent_public_id: string | null;
  display_name: string;
  phone: string | null;
  telegram: string | null;
  is_public_hidden_by_admin: boolean;
};

function getAgentPublicUnavailableReason(input: {
  subscriptionAllowed: boolean;
  isHiddenByAdmin: boolean;
}): PublicUnavailableReason | null {
  if (!input.subscriptionAllowed) {
    return "subscription_expired";
  }

  if (input.isHiddenByAdmin) {
    return "admin_hidden";
  }

  return null;
}

function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapRoomRow(
  room: SupabaseRoomRow,
  photos: RoomPhoto[],
  amenities: string[],
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
    amenities,
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

async function hasAgentRole(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("role", "agent")
    .maybeSingle();

  return Boolean(data);
}

async function resolvePublicAgentProfile(identifier: string): Promise<{
  agent: ResolvedAgentProfile;
  matchedByLegacySlug: boolean;
} | null> {
  const supabase = createSupabaseAdminClient();
  const { data: publicIdData } = await supabase
    .from("profiles")
    .select("id, slug, agent_public_id, display_name, phone, telegram, is_public_hidden_by_admin")
    .eq("agent_public_id", identifier)
    .maybeSingle();

  const publicIdMatch = (publicIdData ?? null) as ResolvedAgentProfile | null;

  if (publicIdMatch) {
    if (!(await hasAgentRole(publicIdMatch.id))) {
      return null;
    }

    return {
      agent: publicIdMatch,
      matchedByLegacySlug: false,
    };
  }

  const { data: legacySlugData } = await supabase
    .from("profiles")
    .select("id, slug, agent_public_id, display_name, phone, telegram, is_public_hidden_by_admin")
    .eq("slug", identifier)
    .maybeSingle();

  const legacySlugMatch = (legacySlugData ?? null) as ResolvedAgentProfile | null;

  if (!legacySlugMatch || !(await hasAgentRole(legacySlugMatch.id))) {
    return null;
  }

  return {
    agent: legacySlugMatch,
    matchedByLegacySlug: true,
  };
}

export const getPublicAgentPageData = cache(
  async (
    agentIdentifier: string,
    filterInput: {
      checkIn?: string;
      checkOut?: string;
      adults?: string | number;
      rooms?: string | number;
    } = {},
  ): Promise<PublicAgentPageData | null> => {
    if (!canUseSupabase()) {
      return null;
    }

    const filters = normalizePublicStayFilters(filterInput);

    try {
      const resolvedAgent = await resolvePublicAgentProfile(agentIdentifier);

      if (!resolvedAgent) {
        return null;
      }

      const { agent, matchedByLegacySlug } = resolvedAgent;

      if (!agent.agent_public_id) {
        return null;
      }

      const supabase = createSupabaseAdminClient();
      const agentSubscription = await getSubscriptionRuntimeState(agent.id, "agent");
      const publicUnavailableReason = getAgentPublicUnavailableReason({
        subscriptionAllowed: agentSubscription.isPublicAllowed,
        isHiddenByAdmin: agent.is_public_hidden_by_admin,
      });

      if (publicUnavailableReason) {
        return {
          agent: null,
          properties: [],
          standaloneRooms: [],
          filters,
          publicUnavailableReason,
          publicWarningText: null,
          shouldRedirectToCanonical: false,
        };
      }

      const [
        { data: linkedPropertyRows },
        { data: linkedStandaloneRoomRows },
        { data: ownPropertyRows },
        { data: ownStandaloneRoomRows },
      ] = await Promise.all([
        supabase.from("agent_property_links").select("property_id").eq("agent_id", agent.id).eq("status", "active"),
        supabase.from("agent_room_links").select("room_id").eq("agent_id", agent.id).eq("status", "active"),
        supabase.from("properties").select("*").eq("owner_id", agent.id).eq("published", true).eq("is_frozen", false),
        supabase
          .from("rooms")
          .select("*")
          .eq("owner_id", agent.id)
          .eq("room_kind", "standalone_room")
          .eq("is_active", true),
      ]);

      const linkedPropertyIds = (linkedPropertyRows ?? []).map((row) => row.property_id as string);
      const linkedStandaloneRoomIds = (linkedStandaloneRoomRows ?? []).map((row) => row.room_id as string);
      const [linkedPropertiesResult, linkedStandaloneRoomsResult] = await Promise.all([
        linkedPropertyIds.length
          ? supabase.from("properties").select("*").in("id", linkedPropertyIds).eq("published", true).eq("is_frozen", false)
          : Promise.resolve({ data: [] }),
        linkedStandaloneRoomIds.length
          ? supabase.from("rooms").select("*").in("id", linkedStandaloneRoomIds).eq("room_kind", "standalone_room").eq("is_active", true)
          : Promise.resolve({ data: [] }),
      ]);

      const rawPropertyMap = new Map<string, SupabasePropertyRow>();
      for (const property of (ownPropertyRows ?? []) as SupabasePropertyRow[]) {
        rawPropertyMap.set(property.id, property);
      }
      for (const property of (linkedPropertiesResult.data ?? []) as SupabasePropertyRow[]) {
        rawPropertyMap.set(property.id, property);
      }

      const rawStandaloneRoomMap = new Map<string, SupabaseRoomRow>();
      for (const room of (ownStandaloneRoomRows ?? []) as SupabaseRoomRow[]) {
        rawStandaloneRoomMap.set(room.id, room);
      }
      for (const room of (linkedStandaloneRoomsResult.data ?? []) as SupabaseRoomRow[]) {
        rawStandaloneRoomMap.set(room.id, room);
      }

      const ownerIds = Array.from(
        new Set([
          ...Array.from(rawPropertyMap.values()).map((property) => property.owner_id),
          ...Array.from(rawStandaloneRoomMap.values()).map((room) => room.owner_id),
        ]),
      );
      const subscriptionStates = await Promise.all(
        ownerIds.map(async (ownerId) => [ownerId, await getSubscriptionRuntimeState(ownerId, "owner")] as const),
      );
      const ownerSubscriptionMap = new Map(subscriptionStates);
      const safeProperties = Array.from(rawPropertyMap.values()).filter(
        (property) => ownerSubscriptionMap.get(property.owner_id)?.isPublicAllowed,
      );
      const safeStandaloneRooms = Array.from(rawStandaloneRoomMap.values()).filter(
        (room) => ownerSubscriptionMap.get(room.owner_id)?.isPublicAllowed,
      );

      if (!safeProperties.length && !safeStandaloneRooms.length) {
        return {
          agent: {
            id: agent.id,
            publicId: agent.agent_public_id,
            legacySlug: agent.slug,
            displayName: agent.display_name,
            phone: agent.phone ?? "",
            telegram: agent.telegram ?? "",
          },
          properties: [],
          standaloneRooms: [],
          filters,
          publicUnavailableReason: null,
          publicWarningText: agentSubscription.publicWarningText,
          shouldRedirectToCanonical: matchedByLegacySlug,
        };
      }

      const propertyIds = safeProperties.map((property) => property.id);
      const allRoomIds = safeStandaloneRooms.map((room) => room.id);
      const [{ data: propertyRoomRows }, { data: propertyPhotoRows }, { data: featureRows }, { data: ruleRows }] = await Promise.all([
        propertyIds.length
          ? supabase.from("rooms").select("*").in("property_id", propertyIds).eq("is_active", true).order("title", { ascending: true })
          : Promise.resolve({ data: [] }),
        propertyIds.length
          ? supabase
              .from("property_photos")
              .select("*")
              .in("property_id", propertyIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
        propertyIds.length
          ? supabase
              .from("property_features")
              .select("property_id, label, sort_order")
              .in("property_id", propertyIds)
              .order("sort_order", { ascending: true })
          : Promise.resolve({ data: [] }),
        propertyIds.length
          ? supabase
              .from("property_rules")
              .select("property_id, label, sort_order")
              .in("property_id", propertyIds)
              .order("sort_order", { ascending: true })
          : Promise.resolve({ data: [] }),
      ]);
      const safePropertyRoomRows = (propertyRoomRows ?? []) as SupabaseRoomRow[];
      const roomIds = [...safePropertyRoomRows.map((room) => room.id), ...allRoomIds];

      const [amenitiesResult, seasonalResult, busyResult, markupResult, roomPhotosResult] = roomIds.length
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
            supabase.from("room_busy_ranges").select("*").in("room_id", roomIds).order("starts_on", { ascending: true }),
            supabase.from("room_agent_markups").select("room_id, markup_percent").eq("agent_id", agent.id).in("room_id", roomIds),
            supabase
              .from("room_photos")
              .select("*")
              .in("room_id", roomIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true }),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

      const featureMap = new Map<string, string[]>();
      const ruleMap = new Map<string, string[]>();
      const amenityMap = new Map<string, string[]>();
      const seasonalMap = new Map<string, OwnerSeasonalPrice[]>();
      const busyMap = new Map<string, OwnerBusyRange[]>();
      const markupMap = new Map<string, number>();

      for (const item of featureRows ?? []) {
        const existing = featureMap.get(item.property_id as string) ?? [];
        existing.push(item.label as string);
        featureMap.set(item.property_id as string, existing);
      }

      for (const item of ruleRows ?? []) {
        const existing = ruleMap.get(item.property_id as string) ?? [];
        existing.push(item.label as string);
        ruleMap.set(item.property_id as string, existing);
      }

      for (const item of amenitiesResult.data ?? []) {
        const existing = amenityMap.get(item.room_id as string) ?? [];
        existing.push(item.label as string);
        amenityMap.set(item.room_id as string, existing);
      }

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

      const propertyPhotoMap = buildPropertyPhotoMap((propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[]);
      const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);
      const roomsByProperty = new Map<string, PublicRoom[]>();

      for (const room of safePropertyRoomRows) {
        if (!room.property_id) {
          continue;
        }

        const publicRoom = buildPublicRoomQuote(
          mapRoomRow(
            room,
            roomPhotoMap.get(room.id) ?? [],
            amenityMap.get(room.id) ?? [],
            seasonalMap.get(room.id) ?? [],
            busyMap.get(room.id) ?? [],
            markupMap.get(room.id) ?? 0,
          ),
          filters,
        );
        const existing = roomsByProperty.get(room.property_id) ?? [];
        existing.push(publicRoom);
        roomsByProperty.set(room.property_id, existing);
      }

      const properties: PublicAgentPropertySection[] = safeProperties
        .map((property) => {
          const propertyRooms = (roomsByProperty.get(property.id) ?? []).sort(
            (a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)),
          );

          return {
            property: {
              id: property.id,
              title: property.title,
              shortTitle: property.short_title,
              slug: property.slug,
              propertyType: property.property_type,
              detailMode: resolvePublicPropertyDetailMode(property.property_type),
              city: property.city,
              address: property.address,
              timezone: property.timezone,
              shortDescription: property.short_description ?? "",
              fullDescription: property.full_description ?? "",
              phone: property.phone ?? "",
              whatsapp: property.whatsapp ?? "",
              telegram: property.telegram ?? "",
              checkInTime: property.check_in_time ?? "",
              checkOutTime: property.check_out_time ?? "",
              photos: withLegacyPropertyCover(propertyPhotoMap.get(property.id) ?? [], property.cover_image_url),
              features: featureMap.get(property.id) ?? [],
              aggregatedAmenities: aggregateRoomAmenities(propertyRooms),
              houseRules: ruleMap.get(property.id) ?? [],
            },
            rooms: propertyRooms,
          };
        })
        .filter((item) => item.rooms.length > 0);

      const standaloneRooms = safeStandaloneRooms
        .map((room) =>
          buildPublicRoomQuote(
            mapRoomRow(
              room,
              roomPhotoMap.get(room.id) ?? [],
              amenityMap.get(room.id) ?? [],
              seasonalMap.get(room.id) ?? [],
              busyMap.get(room.id) ?? [],
              markupMap.get(room.id) ?? 0,
            ),
            filters,
          ),
        )
        .sort((a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)));

      return {
        agent: {
          id: agent.id,
          publicId: agent.agent_public_id,
          legacySlug: agent.slug,
          displayName: agent.display_name,
          phone: agent.phone ?? "",
          telegram: agent.telegram ?? "",
        },
        properties,
        standaloneRooms,
        filters,
        publicUnavailableReason: null,
        publicWarningText: agentSubscription.publicWarningText,
        shouldRedirectToCanonical: matchedByLegacySlug,
      };
    } catch {
      return null;
    }
  },
);

export async function getAgentRequestContext(agentIdentifier: string, propertySlug: string | undefined, roomId: string) {
  const pageData = await getPublicAgentPageData(agentIdentifier);

  if (!pageData?.agent) {
    return null;
  }

  const standaloneRoom = pageData.standaloneRooms.find((room) => room.id === roomId);

  if (standaloneRoom) {
    return {
      agentId: pageData.agent.id,
      agentPublicId: pageData.agent.publicId,
      propertySlug: null,
      roomId: standaloneRoom.id,
      agentMarkupPercent: standaloneRoom.agentMarkupPercent ?? 0,
    };
  }

  if (!propertySlug) {
    return null;
  }

  const propertySection = pageData.properties.find((property) => property.property.slug === propertySlug);
  const room = propertySection?.rooms.find((item) => item.id === roomId);

  if (!propertySection || !room) {
    return null;
  }

  return {
    agentId: pageData.agent.id,
    agentPublicId: pageData.agent.publicId,
    propertySlug: propertySection.property.slug,
    roomId: room.id,
    agentMarkupPercent: room.agentMarkupPercent ?? 0,
  };
}
