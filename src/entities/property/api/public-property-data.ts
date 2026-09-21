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
import { mapBusyRange, mapSeasonalPrice, normalizeRoomKind } from "@/entities/room/model/mappers";
import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room";
import { rooms as mockRooms } from "@/entities/room/model/mock";
import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom, RoomPhoto } from "@/entities/room/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getDemoPropertySlug, isDemoModeEnabled } from "@/shared/api/supabase/env";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";
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
  max_url: string | null;
  telegram: string | null;
  is_public_hidden_by_admin: boolean;
};

type MaybePublicOwnerRow = Omit<PublicOwnerRow, "slug"> & { slug: string | null };

function isPublicOwnerRow(row: MaybePublicOwnerRow | null): row is PublicOwnerRow {
  return Boolean(row?.slug);
}

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
    maxUrl: row.max_url ?? "",
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
    kind: normalizeRoomKind(room.room_kind),
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
      description: room.full_description ?? "",
      phone: room.phone ?? "",
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
      maxUrl: "",
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
          telegram: mockProperty.telegram,
          checkInTime: mockProperty.checkInTime,
          checkOutTime: mockProperty.checkOutTime,
          photos: mockProperty.photos,
          features: mockProperty.features,
          aggregatedAmenities: aggregateRoomAmenities(mockRooms),
          houseRules: mockProperty.houseRules,
        },
        rooms: mockRooms
          .filter((room) => room.status === "active")
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
    if (isDemoModeEnabled() && normalizedSlug !== getDemoPropertySlug()) {
      return null;
    }

    return {
      ownerSlug: normalizedSlug,
      matchedPropertySlug: null,
      shouldRedirect: false,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: ownerData, error: ownerError } = await supabase
      .from("profiles")
      .select("slug")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (ownerError) {
      throw ownerError;
    }

    if (ownerData?.slug) {
      return {
        ownerSlug: ownerData.slug,
        matchedPropertySlug: null,
        shouldRedirect: ownerData.slug !== normalizedSlug,
      };
    }

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("slug, owner_id")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (propertyError) {
      throw propertyError;
    }
    const propertyRow = (propertyData ?? null) as Pick<SupabasePropertyRow, "slug" | "owner_id"> | null;

    if (!propertyRow) {
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("slug")
      .eq("id", propertyRow.owner_id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }
    const ownerSlug = profileData?.slug ?? "";

    if (!ownerSlug) {
      return null;
    }

    return {
      ownerSlug,
      matchedPropertySlug: propertyRow.slug,
      shouldRedirect: ownerSlug !== normalizedSlug,
    };
  } catch (error) {
    logServerDataError("owner_public_slug_resolution_failed", error);
    return {
      ownerSlug: normalizedSlug,
      matchedPropertySlug: null,
      shouldRedirect: false,
    };
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
      if (isDemoModeEnabled()) {
        return normalizedSlug === getDemoPropertySlug() ? toPublicFallbackData(filters) : null;
      }

      logServerConfigurationError("owner_public_page_supabase_not_configured");
      return buildUnavailablePageData(filters, "service_unavailable");
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("id, slug, display_name, phone, max_url, telegram, is_public_hidden_by_admin")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (ownerError) {
        throw ownerError;
      }

      const ownerRow = ownerData ?? null;

      if (!isPublicOwnerRow(ownerRow)) {
        return null;
      }

      const subscription = await getSubscriptionRuntimeState(ownerRow.id, "owner");

      if (!subscription.isPublicAllowed) {
        return buildUnavailablePageData(filters, "subscription_expired");
      }

      if (ownerRow.is_public_hidden_by_admin) {
        return buildUnavailablePageData(filters, "admin_hidden");
      }

      const { data: propertyRows, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", ownerRow.id)
        .eq("published", true)
        .eq("is_frozen", false)
        .order("created_at", { ascending: true });

      if (propertyError) {
        throw propertyError;
      }

      const safePropertyRows = propertyRows ?? [];

      const propertyIds = safePropertyRows.map((property) => property.id);
      const [propertyChildren, standaloneRoomResult] = await Promise.all([
        propertyIds.length
          ? Promise.all([
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
            ])
          : Promise.resolve([
              { data: [], error: null },
              { data: [], error: null },
              { data: [], error: null },
              { data: [], error: null },
            ]),
        supabase
          .from("rooms")
          .select("*")
          .eq("owner_id", ownerRow.id)
          .eq("room_kind", "standalone_room")
          .eq("is_active", true)
          .order("title", { ascending: true }),
      ]);
      const [roomResult, featureResult, ruleResult, propertyPhotoResult] = propertyChildren;
      const { data: standaloneRoomRows, error: standaloneRoomError } = standaloneRoomResult;

      for (const result of [roomResult, featureResult, ruleResult, propertyPhotoResult]) {
        if (result.error) {
          throw result.error;
        }
      }

      if (standaloneRoomError) {
        throw standaloneRoomError;
      }

      const roomRows = roomResult.data;
      const featureRows = featureResult.data;
      const ruleRows = ruleResult.data;
      const propertyPhotoRows = propertyPhotoResult.data;

      const safeRoomRows = roomRows ?? [];
      const safeStandaloneRoomRows = standaloneRoomRows ?? [];
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
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ];

      for (const result of [amenitiesResult, seasonalResult, busyResult, roomPhotosResult]) {
        if (result.error) {
          throw result.error;
        }
      }

      const featureMap = new Map<string, string[]>();
      const ruleMap = new Map<string, string[]>();
      const amenityMap = new Map<string, string[]>();
      const seasonalMap = new Map<string, OwnerSeasonalPrice[]>();
      const busyMap = new Map<string, OwnerBusyRange[]>();

      for (const item of featureRows ?? []) {
        const current = featureMap.get(item.property_id) ?? [];
        current.push(item.label);
        featureMap.set(item.property_id, current);
      }

      for (const item of ruleRows ?? []) {
        const current = ruleMap.get(item.property_id) ?? [];
        current.push(item.label);
        ruleMap.set(item.property_id, current);
      }

      for (const item of amenitiesResult.data ?? []) {
        const current = amenityMap.get(item.room_id) ?? [];
        current.push(item.label);
        amenityMap.set(item.room_id, current);
      }

      for (const item of seasonalResult.data ?? []) {
        const current = seasonalMap.get(item.room_id) ?? [];
        current.push(mapSeasonalPrice(item));
        seasonalMap.set(item.room_id, current);
      }

      for (const item of busyResult.data ?? []) {
        const current = busyMap.get(item.room_id) ?? [];
        current.push(mapBusyRange(item));
        busyMap.set(item.room_id, current);
      }

      const propertyPhotoMap = buildPropertyPhotoMap(propertyPhotoRows ?? []);
      const roomPhotoMap = buildRoomPhotoMap(roomPhotosResult.data ?? []);
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
    } catch (error) {
      logServerDataError("owner_public_page_load_failed", error);
      return buildUnavailablePageData(filters, "service_unavailable");
    }
  },
);
