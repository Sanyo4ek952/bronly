import type { OwnerPropertyListItem } from "@/entities/property/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type { SupabasePropertyRow } from "@/shared/api/supabase/types";

export async function getOwnerProperties(): Promise<OwnerPropertyListItem[]> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: propertyRows } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  const safePropertyRows = (propertyRows ?? []) as SupabasePropertyRow[];

  if (!safePropertyRows.length) {
    return [];
  }

  const propertyIds = safePropertyRows.map((item) => item.id);
  const { data: roomRows } = await supabase
    .from("rooms")
    .select("id, property_id, is_active")
    .in("property_id", propertyIds);

  const roomStats = new Map<string, { roomCount: number; activeRoomCount: number }>();

  for (const row of (roomRows ?? []) as Array<{ property_id: string; is_active: boolean }>) {
    const current = roomStats.get(row.property_id) ?? { roomCount: 0, activeRoomCount: 0 };
    current.roomCount += 1;
    if (row.is_active) {
      current.activeRoomCount += 1;
    }
    roomStats.set(row.property_id, current);
  }

  return safePropertyRows.map((row) => {
    const stats = roomStats.get(row.id) ?? { roomCount: 0, activeRoomCount: 0 };

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortTitle: row.short_title,
      propertyType: row.property_type,
      city: row.city,
      address: row.address,
      published: row.published,
      isFrozen: row.is_frozen,
      coverImageUrl: row.cover_image_url ?? "",
      roomCount: stats.roomCount,
      activeRoomCount: stats.activeRoomCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}
