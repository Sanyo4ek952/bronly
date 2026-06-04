import { cache } from "react";

import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import { property as mockProperty } from "@/entities/property/model/mock";
import type { PublicPropertyPageData } from "@/entities/property/model/types";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room";
import { rooms as mockRooms } from "@/entities/room/model/mock";
import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom, RoomPhoto } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getDemoPropertySlug } from "@/shared/api/supabase/env";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type {
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

function toPublicFallbackData(filters: PublicStayFilters): PublicPropertyPageData {
  return {
    property: {
      id: mockProperty.id,
      title: mockProperty.title,
      shortTitle: mockProperty.shortTitle,
      slug: mockProperty.slug,
      propertyType: mockProperty.propertyType,
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
    filters,
    publicUnavailableReason: null,
    publicWarningText: null,
  };
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
    title: room.title,
    subtitle: room.subtitle ?? "",
    capacity: room.capacity,
    bedrooms: room.bedrooms,
    area: room.area,
    pricePerNight: Number(room.price_per_night),
    status: room.is_active ? "active" : "inactive",
    photos,
    amenities,
    seasonalPrices,
    busyRanges,
  };
}

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
    const filters = normalizePublicStayFilters(filterInput);

    if (!canUseSupabase()) {
      return slug === getDemoPropertySlug() ? toPublicFallbackData(filters) : null;
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      const propertyRow = data as SupabasePropertyRow | null;

      if (!propertyRow || propertyRow.is_frozen) {
        return null;
      }

      const subscription = await getSubscriptionRuntimeState(propertyRow.owner_id, "owner");

      if (!subscription.isPublicAllowed) {
        return {
          property: null,
          rooms: [],
          filters,
          publicUnavailableReason: "subscription_expired",
          publicWarningText: null,
        };
      }

      const [{ data: roomRows }, { data: featureRows }, { data: ruleRows }, { data: propertyPhotoRows }] = await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .eq("property_id", propertyRow.id)
          .eq("is_active", true)
          .order("title", { ascending: true }),
        supabase
          .from("property_features")
          .select("label, sort_order")
          .eq("property_id", propertyRow.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("property_rules")
          .select("label, sort_order")
          .eq("property_id", propertyRow.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("property_photos")
          .select("*")
          .eq("property_id", propertyRow.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      const safeRoomRows = (roomRows ?? []) as SupabaseRoomRow[];
      const roomIds = safeRoomRows.map((room) => room.id);
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

      const amenityMap = new Map<string, string[]>();
      const seasonalMap = new Map<string, OwnerSeasonalPrice[]>();
      const busyMap = new Map<string, OwnerBusyRange[]>();

      for (const item of amenitiesResult.data ?? []) {
        const existing = amenityMap.get(item.room_id) ?? [];
        existing.push(item.label);
        amenityMap.set(item.room_id, existing);
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

      const propertyPhotos = withLegacyPropertyCover(
        buildPropertyPhotoMap((propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[]).get(propertyRow.id) ?? [],
        propertyRow.cover_image_url,
      );
      const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);

      const rooms = safeRoomRows
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

      return {
        property: {
          id: propertyRow.id,
          title: propertyRow.title,
          shortTitle: propertyRow.short_title,
          slug: propertyRow.slug,
          propertyType: propertyRow.property_type,
          city: propertyRow.city,
          address: propertyRow.address,
          timezone: propertyRow.timezone,
          shortDescription: propertyRow.short_description ?? "",
          fullDescription: propertyRow.full_description ?? "",
          phone: propertyRow.phone ?? "",
          whatsapp: propertyRow.whatsapp ?? "",
          telegram: propertyRow.telegram ?? "",
          checkInTime: propertyRow.check_in_time ?? "",
          checkOutTime: propertyRow.check_out_time ?? "",
          photos: propertyPhotos,
          features: (featureRows ?? []).map((item) => item.label as string),
          houseRules: (ruleRows ?? []).map((item) => item.label as string),
        },
        rooms,
        filters,
        publicUnavailableReason: null,
        publicWarningText: subscription.publicWarningText,
      };
    } catch {
      return null;
    }
  },
);
