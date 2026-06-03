import type { OwnerPropertyDetail } from "@/entities/property/model/types";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerBusyRange, OwnerRoomDetail, OwnerSeasonalPrice } from "@/entities/room/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabasePropertyFeatureRow,
  SupabasePropertyRow,
  SupabasePropertyRuleRow,
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

export function mapOwnerRoomRow(
  row: SupabaseRoomRow,
  amenities: string[],
  seasonalPrices: OwnerSeasonalPrice[],
  busyRanges: OwnerBusyRange[],
): OwnerRoomDetail {
  return {
    id: row.id,
    propertyId: row.property_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    capacity: row.capacity,
    bedrooms: row.bedrooms,
    area: row.area,
    pricePerNight: Number(row.price_per_night),
    isActive: row.is_active,
    amenities,
    seasonalPrices,
    busyRanges,
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

  const [{ data: featureRows }, { data: ruleRows }, { data: roomRows }] = await Promise.all([
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
  ]);

  const safeRoomRows = (roomRows ?? []) as SupabaseRoomRow[];
  const roomIds = safeRoomRows.map((room) => room.id);

  const [amenitiesResult, seasonalResult, busyResult] = roomIds.length
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
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

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

  return {
    id: propertyRow.id,
    ownerId: propertyRow.owner_id,
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
    coverImageUrl: propertyRow.cover_image_url ?? "",
    features: ((featureRows ?? []) as SupabasePropertyFeatureRow[]).map((item) => item.label),
    houseRules: ((ruleRows ?? []) as SupabasePropertyRuleRow[]).map((item) => item.label),
    rooms: safeRoomRows.map((room) =>
      mapOwnerRoomRow(
        room,
        amenityMap.get(room.id) ?? [],
        seasonalMap.get(room.id) ?? [],
        busyMap.get(room.id) ?? [],
      ),
    ),
  };
}
