import { buildRoomPhotoMap } from "@/entities/property/api/photo-utils";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import type { OwnerRoomDetail } from "@/entities/room/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

export async function getOwnerRoomDetail(roomId: string): Promise<OwnerRoomDetail | null> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .eq("owner_id", profile.id)
    .maybeSingle();
  const room = (roomData ?? null) as SupabaseRoomRow | null;

  if (!room) {
    return null;
  }

  const [amenitiesResult, seasonalResult, busyResult, roomPhotosResult, propertyResult] = await Promise.all([
    supabase.from("room_amenities").select("*").eq("room_id", room.id).order("sort_order", { ascending: true }),
    supabase.from("room_seasonal_prices").select("*").eq("room_id", room.id).order("starts_on", { ascending: true }),
    supabase.from("room_busy_ranges").select("*").eq("room_id", room.id).order("starts_on", { ascending: true }),
    supabase
      .from("room_photos")
      .select("*")
      .eq("room_id", room.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    room.property_id ? supabase.from("properties").select("title, slug").eq("id", room.property_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const roomPhotoMap = buildRoomPhotoMap((roomPhotosResult.data ?? []) as SupabaseRoomPhotoRow[]);
  const amenities = ((amenitiesResult.data ?? []) as SupabaseRoomAmenityRow[]).map((item) => item.label);
  const seasonalPrices = ((seasonalResult.data ?? []) as SupabaseRoomSeasonalPriceRow[]).map(mapSeasonalPrice);
  const busyRanges = ((busyResult.data ?? []) as SupabaseRoomBusyRangeRow[]).map(mapBusyRange);
  const property = propertyResult.data as { title?: string; slug?: string } | null;

  return {
    id: room.id,
    ownerId: room.owner_id,
    kind: room.room_kind,
    propertyId: room.property_id,
    slug: room.slug,
    title: room.title,
    subtitle: room.subtitle ?? "",
    propertyTitle: property?.title ?? room.title,
    propertySlug: property?.slug ?? null,
    capacity: room.capacity,
    bedrooms: room.bedrooms,
    area: room.area,
    pricePerNight: Number(room.price_per_night),
    isActive: room.is_active,
    photos: roomPhotoMap.get(room.id) ?? [],
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
