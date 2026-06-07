import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import type { OwnerPropertyDetail } from "@/entities/property/model/types";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerBusyRange, OwnerRoomDetail, OwnerSeasonalPrice, RoomPhoto } from "@/entities/room/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabasePropertyFeatureRow,
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabasePropertyRuleRow,
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

export function mapOwnerRoomRow(
  row: SupabaseRoomRow,
  property: { title: string; slug: string; propertyType: string; city: string; address: string; timezone: string },
  photos: RoomPhoto[],
  amenities: string[],
  seasonalPrices: OwnerSeasonalPrice[],
  busyRanges: OwnerBusyRange[],
): OwnerRoomDetail {
  return {
    id: row.id,
    ownerId: row.owner_id,
    kind: row.room_kind,
    propertyId: row.property_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    propertyTitle: property.title,
    propertySlug: property.slug,
    capacity: row.capacity,
    bedrooms: row.bedrooms,
    area: row.area,
    pricePerNight: Number(row.price_per_night),
    isActive: row.is_active,
    photos,
    amenities,
    seasonalPrices,
    busyRanges,
    location: {
      propertyId: row.property_id,
      propertyType: row.property_type ?? property.propertyType,
      city: row.city ?? property.city,
      address: row.address ?? property.address,
      timezone: row.timezone ?? property.timezone,
      shortDescription: row.short_description ?? "",
      fullDescription: row.full_description ?? "",
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      telegram: row.telegram ?? "",
      checkInTime: row.check_in_time ?? "",
      checkOutTime: row.check_out_time ?? "",
      allowAgentInquiries: row.allow_agent_inquiries,
      allowOwnerContactSharing: row.allow_owner_contact_sharing,
    },
  };
}

export async function getOwnerPropertyDetail(propertyIdOrSlug: string): Promise<OwnerPropertyDetail | null> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: propertyRowData } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", profile.id)
    .or(`id.eq.${propertyIdOrSlug},slug.eq.${propertyIdOrSlug}`)
    .maybeSingle();
  const propertyRow = propertyRowData as SupabasePropertyRow | null;

  if (!propertyRow) {
    return null;
  }

  const [{ data: featureRows }, { data: ruleRows }, { data: roomRows }, { data: propertyPhotoRows }] = await Promise.all([
    supabase
      .from("property_features")
      .select("*")
      .eq("property_id", propertyRow.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_rules")
      .select("*")
      .eq("property_id", propertyRow.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("rooms")
      .select("*")
      .eq("property_id", propertyRow.id)
      .order("created_at", { ascending: true }),
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
          .select("*")
          .in("room_id", roomIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("room_seasonal_prices")
          .select("*")
          .in("room_id", roomIds)
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

  for (const amenity of (amenitiesResult.data ?? []) as SupabaseRoomAmenityRow[]) {
    const current = amenityMap.get(amenity.room_id) ?? [];
    current.push(amenity.label);
    amenityMap.set(amenity.room_id, current);
  }

  for (const price of (seasonalResult.data ?? []) as SupabaseRoomSeasonalPriceRow[]) {
    const current = seasonalMap.get(price.room_id) ?? [];
    current.push(mapSeasonalPrice(price));
    seasonalMap.set(price.room_id, current);
  }

  for (const range of (busyResult.data ?? []) as SupabaseRoomBusyRangeRow[]) {
    const current = busyMap.get(range.room_id) ?? [];
    current.push(mapBusyRange(range));
    busyMap.set(range.room_id, current);
  }

  const propertyPhotoMap = buildPropertyPhotoMap((propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[]);
  const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);
  const propertyPhotos = withLegacyPropertyCover(propertyPhotoMap.get(propertyRow.id) ?? [], propertyRow.cover_image_url);

  return {
    id: propertyRow.id,
    ownerId: propertyRow.owner_id,
    ownerPublicSlug: profile.slug || null,
    slug: propertyRow.slug,
    title: propertyRow.title,
    shortTitle: propertyRow.short_title,
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
    published: propertyRow.published,
    isFrozen: propertyRow.is_frozen,
    allowAgentInquiries: propertyRow.allow_agent_inquiries,
    allowOwnerContactSharing: propertyRow.allow_owner_contact_sharing,
    photos: propertyPhotos,
    coverImageUrl: propertyPhotos[0]?.url ?? propertyRow.cover_image_url ?? "",
    features: ((featureRows ?? []) as SupabasePropertyFeatureRow[]).map((item) => item.label),
    houseRules: ((ruleRows ?? []) as SupabasePropertyRuleRow[]).map((item) => item.label),
    rooms: safeRoomRows.map((room) =>
      mapOwnerRoomRow(
        room,
        {
          title: propertyRow.title,
          slug: propertyRow.slug,
          propertyType: propertyRow.property_type,
          city: propertyRow.city,
          address: propertyRow.address,
          timezone: propertyRow.timezone,
        },
        roomPhotoMap.get(room.id) ?? [],
        amenityMap.get(room.id) ?? [],
        seasonalMap.get(room.id) ?? [],
        busyMap.get(room.id) ?? [],
      ),
    ),
  };
}
