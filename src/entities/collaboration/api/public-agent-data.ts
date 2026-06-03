import { cache } from "react";

import type { PublicAgentPageData, PublicAgentPropertySection } from "@/entities/collaboration/model/types";
import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type {
  SupabasePropertyRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

function mapRoomRow(
  room: SupabaseRoomRow,
  seasonalPrices: OwnerSeasonalPrice[],
  busyRanges: OwnerBusyRange[],
  agentMarkupPercent: number,
): PublicRoom {
  return {
    id: room.id,
    title: room.title,
    subtitle: room.subtitle ?? "",
    capacity: room.capacity,
    bedrooms: room.bedrooms,
    area: room.area,
    pricePerNight: Number(room.price_per_night),
    status: room.is_active ? "active" : "inactive",
    amenities: [],
    seasonalPrices,
    busyRanges,
    agentMarkupPercent,
  };
}

export const getPublicAgentPageData = cache(
  async (
    agentSlug: string,
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
      const supabase = createSupabaseAdminClient();
      const { data: agentData } = await supabase
        .from("profiles")
        .select("id, slug, display_name, phone, telegram")
        .eq("slug", agentSlug)
        .maybeSingle();

      const agent = agentData as {
        id: string;
        slug: string;
        display_name: string;
        phone: string | null;
        telegram: string | null;
      } | null;

      if (!agent) {
        return null;
      }

      const agentSubscription = await getSubscriptionRuntimeState(agent.id, "agent");

      if (!agentSubscription.isPublicAllowed) {
        return {
          agent: null,
          properties: [],
          filters,
          publicUnavailableReason: "subscription_expired",
          publicWarningText: null,
        };
      }

      const [{ data: linkedRows }, { data: ownPropertyRows }] = await Promise.all([
        supabase
          .from("agent_property_links")
          .select("property_id")
          .eq("agent_id", agent.id)
          .eq("status", "active"),
        supabase
          .from("properties")
          .select("*")
          .eq("owner_id", agent.id)
          .eq("published", true)
          .eq("is_frozen", false),
      ]);

      const linkedPropertyIds = (linkedRows ?? []).map((row) => row.property_id as string);
      const linkedPropertiesResult = linkedPropertyIds.length
        ? await supabase
            .from("properties")
            .select("*")
            .in("id", linkedPropertyIds)
            .eq("published", true)
            .eq("is_frozen", false)
        : { data: [] };

      const rawPropertyMap = new Map<string, SupabasePropertyRow>();
      for (const property of (ownPropertyRows ?? []) as SupabasePropertyRow[]) {
        rawPropertyMap.set(property.id, property);
      }
      for (const property of (linkedPropertiesResult.data ?? []) as SupabasePropertyRow[]) {
        rawPropertyMap.set(property.id, property);
      }

      const subscriptionStates = await Promise.all(
        Array.from(new Set(Array.from(rawPropertyMap.values()).map((property) => property.owner_id))).map(
          async (ownerId) => [ownerId, await getSubscriptionRuntimeState(ownerId, "owner")] as const,
        ),
      );
      const ownerSubscriptionMap = new Map(subscriptionStates);
      const safeProperties = Array.from(rawPropertyMap.values()).filter(
        (property) => ownerSubscriptionMap.get(property.owner_id)?.isPublicAllowed,
      );

      if (!safeProperties.length) {
        return {
          agent: {
            id: agent.id,
            slug: agent.slug,
            displayName: agent.display_name,
            phone: agent.phone ?? "",
            telegram: agent.telegram ?? "",
          },
          properties: [],
          filters,
          publicUnavailableReason: null,
          publicWarningText: agentSubscription.publicWarningText,
        };
      }

      const propertyIds = safeProperties.map((property) => property.id);
      const { data: roomRows } = await supabase
        .from("rooms")
        .select("*")
        .in("property_id", propertyIds)
        .eq("is_active", true)
        .order("title", { ascending: true });
      const safeRoomRows = (roomRows ?? []) as SupabaseRoomRow[];
      const roomIds = safeRoomRows.map((room) => room.id);

      const [seasonalResult, busyResult, markupResult] = roomIds.length
        ? await Promise.all([
            supabase
              .from("room_seasonal_prices")
              .select("*")
              .in("room_id", roomIds)
              .eq("is_active", true)
              .order("starts_on", { ascending: true }),
            supabase.from("room_busy_ranges").select("*").in("room_id", roomIds).order("starts_on", { ascending: true }),
            supabase.from("room_agent_markups").select("room_id, markup_percent").eq("agent_id", agent.id).in("room_id", roomIds),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }];

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

      const roomsByProperty = new Map<string, PublicRoom[]>();
      for (const room of safeRoomRows) {
        const publicRoom = buildPublicRoomQuote(
          mapRoomRow(
            room,
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
        .map((property) => ({
          property: {
            id: property.id,
            slug: property.slug,
            title: property.title,
            shortTitle: property.short_title,
            city: property.city,
            address: property.address,
          },
          rooms: (roomsByProperty.get(property.id) ?? []).sort(
            (a, b) => Number(Boolean(b.isAvailableForFilter)) - Number(Boolean(a.isAvailableForFilter)),
          ),
        }))
        .filter((item) => item.rooms.length > 0);

      return {
        agent: {
          id: agent.id,
          slug: agent.slug,
          displayName: agent.display_name,
          phone: agent.phone ?? "",
          telegram: agent.telegram ?? "",
        },
        properties,
        filters,
        publicUnavailableReason: null,
        publicWarningText: agentSubscription.publicWarningText,
      };
    } catch {
      return null;
    }
  },
);

export async function getAgentRequestContext(agentSlug: string, propertySlug: string, roomId: string) {
  const pageData = await getPublicAgentPageData(agentSlug);

  if (!pageData?.agent) {
    return null;
  }

  const propertySection = pageData.properties.find((property) => property.property.slug === propertySlug);
  const room = propertySection?.rooms.find((item) => item.id === roomId);

  if (!propertySection || !room) {
    return null;
  }

  return {
    agentId: pageData.agent.id,
    agentSlug: pageData.agent.slug,
    propertySlug: propertySection.property.slug,
    roomId: room.id,
    agentMarkupPercent: room.agentMarkupPercent ?? 0,
  };
}
