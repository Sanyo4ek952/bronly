import type { PropertyPhoto } from "@/entities/property/model/types";
import type { RoomPhoto } from "@/entities/room/model/types";
import type {
  SupabasePropertyPhotoRow,
  SupabaseRoomPhotoRow,
} from "@/shared/api/supabase/types";

function sortByOrder<T extends { sort_order: number; created_at: string }>(left: T, right: T) {
  if (left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }

  return left.created_at.localeCompare(right.created_at);
}

export function mapPropertyPhotoRow(row: SupabasePropertyPhotoRow): PropertyPhoto {
  return {
    id: row.id,
    url: row.public_url,
    sortOrder: row.sort_order,
  };
}

export function mapRoomPhotoRow(row: SupabaseRoomPhotoRow): RoomPhoto {
  return {
    id: row.id,
    url: row.public_url,
    sortOrder: row.sort_order,
  };
}

export function buildPropertyPhotoMap(rows: SupabasePropertyPhotoRow[]) {
  const map = new Map<string, PropertyPhoto[]>();

  for (const row of [...rows].sort(sortByOrder)) {
    const current = map.get(row.property_id) ?? [];
    current.push(mapPropertyPhotoRow(row));
    map.set(row.property_id, current);
  }

  return map;
}

export function buildRoomPhotoMap(rows: SupabaseRoomPhotoRow[]) {
  const map = new Map<string, RoomPhoto[]>();

  for (const row of [...rows].sort(sortByOrder)) {
    const current = map.get(row.room_id) ?? [];
    current.push(mapRoomPhotoRow(row));
    map.set(row.room_id, current);
  }

  return map;
}

export function withLegacyPropertyCover(photos: PropertyPhoto[], coverImageUrl: string | null) {
  if (photos.length || !coverImageUrl) {
    return photos;
  }

  return [
    {
      id: `legacy-${coverImageUrl}`,
      url: coverImageUrl,
      sortOrder: 0,
    },
  ];
}
