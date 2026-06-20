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
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
} from "@/shared/api/supabase/types";

function mapPropertyListItem(
  row: SupabasePropertyRow,
  ownerPublicSlug: string | null,
  stats: { roomCount: number; activeRoomCount: number; busyRangeCount: number },
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
    busyRangeCount: stats.busyRangeCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStandaloneRoomListItem(
  row: SupabaseRoomRow,
  ownerPublicSlug: string | null,
  photoRows: SupabaseRoomPhotoRow[],
  busyRangeCount: number,
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
    busyRangeCount,
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

  const safeRoomRows = (roomRows ?? []) as Array<{ id: string; property_id: string; is_active: boolean }>;
  const roomIds = safeRoomRows.map((row) => row.id);
  const roomStats = new Map<string, { roomCount: number; activeRoomCount: number; busyRangeCount: number }>();
  const { data: busyRows } = roomIds.length
    ? await supabase.from("room_busy_ranges").select("room_id").in("room_id", roomIds)
    : { data: [] };
  const busyCountByRoom = new Map<string, number>();

  for (const row of (busyRows ?? []) as SupabaseRoomBusyRangeRow[]) {
    busyCountByRoom.set(row.room_id, (busyCountByRoom.get(row.room_id) ?? 0) + 1);
  }

  for (const row of safeRoomRows) {
    const current = roomStats.get(row.property_id) ?? { roomCount: 0, activeRoomCount: 0, busyRangeCount: 0 };
    current.roomCount += 1;

    if (row.is_active) {
      current.activeRoomCount += 1;
    }

    current.busyRangeCount += busyCountByRoom.get(row.id) ?? 0;

    roomStats.set(row.property_id, current);
  }

  return safePropertyRows.map((row) =>
    mapPropertyListItem(
      row,
      profile.slug || null,
      roomStats.get(row.id) ?? { roomCount: 0, activeRoomCount: 0, busyRangeCount: 0 },
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
  const roomStats = new Map<string, { roomCount: number; activeRoomCount: number; busyRangeCount: number }>();
  const standaloneBusyRangeCount = new Map<string, number>();

  if (propertyIds.length) {
    const { data: roomRows } = await supabase
      .from("rooms")
      .select("id, property_id, is_active")
      .in("property_id", propertyIds);
    const safeRoomRows = (roomRows ?? []) as Array<{ id: string; property_id: string; is_active: boolean }>;
    const roomIds = safeRoomRows.map((row) => row.id);
    const { data: busyRows } = roomIds.length
      ? await supabase.from("room_busy_ranges").select("room_id").in("room_id", roomIds)
      : { data: [] };
    const busyCountByRoom = new Map<string, number>();

    for (const row of (busyRows ?? []) as SupabaseRoomBusyRangeRow[]) {
      busyCountByRoom.set(row.room_id, (busyCountByRoom.get(row.room_id) ?? 0) + 1);
    }

    for (const row of safeRoomRows) {
      const current = roomStats.get(row.property_id) ?? { roomCount: 0, activeRoomCount: 0, busyRangeCount: 0 };
      current.roomCount += 1;

      if (row.is_active) {
        current.activeRoomCount += 1;
      }

      current.busyRangeCount += busyCountByRoom.get(row.id) ?? 0;

      roomStats.set(row.property_id, current);
    }
  }

  if (safeStandaloneRows.length) {
    const standaloneIds = safeStandaloneRows.map((row) => row.id);
    const { data: busyRows } = await supabase.from("room_busy_ranges").select("room_id").in("room_id", standaloneIds);

    for (const row of (busyRows ?? []) as SupabaseRoomBusyRangeRow[]) {
      standaloneBusyRangeCount.set(row.room_id, (standaloneBusyRangeCount.get(row.room_id) ?? 0) + 1);
    }
  }

  const propertyItems = safePropertyRows.map((row) =>
    mapPropertyListItem(
      row,
      profile.slug || null,
      roomStats.get(row.id) ?? { roomCount: 0, activeRoomCount: 0, busyRangeCount: 0 },
      (propertyPhotoRows ?? []) as SupabasePropertyPhotoRow[],
    ),
  );
  const standaloneItems = safeStandaloneRows.map((row) =>
    mapStandaloneRoomListItem(
      row,
      profile.slug || null,
      (roomPhotoRows ?? []) as SupabaseRoomPhotoRow[],
      standaloneBusyRangeCount.get(row.id) ?? 0,
    ),
  );

  return [...propertyItems, ...standaloneItems].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
