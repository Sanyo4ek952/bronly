import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import type {
  OwnerInventoryListItem,
  OwnerPropertyListItem,
  OwnerStandaloneRoomListItem,
} from "@/entities/property/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
} from "@/shared/api/supabase/types";

function mapPropertyListItem(
  row: SupabasePropertyRow,
  ownerPublicSlug: string | null,
  stats: { roomCount: number; activeRoomCount: number },
  photoRows: SupabasePropertyPhotoRow[],
): OwnerPropertyListItem {
  const photoMap = buildPropertyPhotoMap(photoRows);
  const photos = withLegacyPropertyCover(photoMap.get(row.id) ?? [], row.cover_image_url);

  return {
    kind: "property",
    id: row.id,
    ownerPublicSlug,
    slug: row.slug,
    title: row.title,
    shortTitle: row.short_title,
    propertyType: row.property_type,
    city: row.city,
    address: row.address,
    published: row.published,
    isFrozen: row.is_frozen,
    photos,
    coverImageUrl: photos[0]?.url ?? row.cover_image_url ?? "",
    roomCount: stats.roomCount,
    activeRoomCount: stats.activeRoomCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStandaloneRoomListItem(
  row: SupabaseRoomRow,
  ownerPublicSlug: string | null,
  photoRows: SupabaseRoomPhotoRow[],
): OwnerStandaloneRoomListItem {
  const photoMap = buildRoomPhotoMap(photoRows);
  const photos = photoMap.get(row.id) ?? [];

  return {
    kind: "standalone_room",
    id: row.id,
    ownerPublicSlug,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    propertyType: row.property_type ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    timezone: row.timezone ?? "",
    isActive: row.is_active,
    photos,
    coverImageUrl: photos[0]?.url ?? "",
    pricePerNight: Number(row.price_per_night),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
  const [{ data: roomRows }, { data: photoRows }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, property_id, is_active")
      .in("property_id", propertyIds),
    supabase
      .from("property_photos")
      .select("*")
      .in("property_id", propertyIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const roomStats = new Map<string, { roomCount: number; activeRoomCount: number }>();

  for (const row of (roomRows ?? []) as Array<{ property_id: string; is_active: boolean }>) {
    const current = roomStats.get(row.property_id) ?? { roomCount: 0, activeRoomCount: 0 };
    current.roomCount += 1;

    if (row.is_active) {
      current.activeRoomCount += 1;
    }

    roomStats.set(row.property_id, current);
  }

  return safePropertyRows.map((row) =>
    mapPropertyListItem(
      row,
      profile.slug || null,
      roomStats.get(row.id) ?? { roomCount: 0, activeRoomCount: 0 },
      (photoRows ?? []) as SupabasePropertyPhotoRow[],
    ),
  );
}

export async function getOwnerInventory(): Promise<OwnerInventoryListItem[]> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: propertyRows }, { data: standaloneRows }, { data: propertyPhotoRows }, { data: roomPhotoRows }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("owner_id", profile.id).order("created_at", { ascending: true }),
      supabase
        .from("rooms")
        .select("*")
        .eq("owner_id", profile.id)
        .eq("room_kind", "standalone_room")
        .order("created_at", { ascending: true }),
      supabase
        .from("property_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("room_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  const safePropertyRows = (propertyRows ?? []) as SupabasePropertyRow[];
  const safeStandaloneRows = (standaloneRows ?? []) as SupabaseRoomRow[];
  const propertyIds = safePropertyRows.map((item) => item.id);
  const roomStats = new Map<string, { roomCount: number; activeRoomCount: number }>();

  if (propertyIds.length) {
    const { data: roomRows } = await supabase
      .from("rooms")
      .select("property_id, is_active")
      .in("property_id", propertyIds);

    for (const row of (roomRows ?? []) as Array<{ property_id: string; is_active: boolean }>) {
      const current = roomStats.get(row.property_id) ?? { roomCount: 0, activeRoomCount: 0 };
      current.roomCount += 1;

      if (row.is_active) {
        current.activeRoomCount += 1;
      }

      roomStats.set(row.property_id, current);
    }
  }

  const propertyItems = safePropertyRows.map((row) =>
    mapPropertyListItem(
      row,
      profile.slug || null,
      roomStats.get(row.id) ?? { roomCount: 0, activeRoomCount: 0 },
      (propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[],
    ),
  );
  const standaloneItems = safeStandaloneRows.map((row) =>
    mapStandaloneRoomListItem(row, profile.slug || null, (roomPhotoRows ?? []) as SupabaseRoomPhotoRow[]),
  );

  return [...propertyItems, ...standaloneItems].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
