import type { SupabaseCollectionRow } from "@/shared/api/supabase";

import type {
  CollectionAccessCandidate,
  CollectionChoice,
  CollectionItem,
  CollectionSummary,
} from "../model/types";
import type { CollectionItemQueryRow, PropertyCandidateRow, RoomCandidateRow } from "./collection-types";

export function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function mapCollectionSummary(row: SupabaseCollectionRow, itemCount: number): CollectionSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    isArchived: row.is_archived,
    itemCount,
    viewsCount: row.views_count,
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPropertyCandidate(row: PropertyCandidateRow, currentProfileId: string): CollectionAccessCandidate {
  return {
    id: row.id,
    title: row.title,
    subtitle: `${row.city}, ${row.address}`,
    scope: row.owner_id === currentProfileId ? "own" : "collaboration",
  };
}

export function mapRoomCandidate(row: RoomCandidateRow, currentProfileId: string): CollectionAccessCandidate | null {
  const property = getSingleRow(row.properties);

  if (!property && row.room_kind !== "standalone_room") {
    return null;
  }

  const subtitleParts = [property?.title ?? row.property_type ?? "Отдельный номер"];
  if (row.subtitle) {
    subtitleParts.push(row.subtitle);
  }
  subtitleParts.push(property?.city ?? row.city ?? "");

  return {
    id: row.id,
    title: row.title,
    subtitle: subtitleParts.join(" · "),
    scope: (property?.owner_id ?? row.owner_id) === currentProfileId ? "own" : "collaboration",
  };
}

export function mapCollectionChoice(
  item: CollectionAccessCandidate,
  selectedIds: Set<string | null>,
): CollectionChoice {
  return {
    ...item,
    isSelected: selectedIds.has(item.id),
  };
}

export function mapCollectionItem(row: CollectionItemQueryRow): CollectionItem | null {
  if (row.property_id) {
    const property = getSingleRow(row.properties);

    if (!property) {
      return null;
    }

    return {
      id: row.id,
      kind: "property",
      propertyId: row.property_id,
      roomId: null,
      sortOrder: row.sort_order,
      title: property.title,
      subtitle: `${property.city}, ${property.address}`,
      createdAt: row.created_at,
    };
  }

  if (!row.room_id) {
    return null;
  }

  const room = getSingleRow(row.rooms);
  const property = room ? getSingleRow(room.properties) : null;

  if (!room) {
    return null;
  }

  const subtitleParts = [property?.title ?? room.property_type ?? "Отдельный номер"];
  if (room.subtitle) {
    subtitleParts.push(room.subtitle);
  }
  subtitleParts.push(property?.city ?? room.city ?? "");

  return {
    id: row.id,
    kind: "room",
    propertyId: room.property_id,
    roomId: row.room_id,
    sortOrder: row.sort_order,
    title: room.title,
    subtitle: subtitleParts.join(" · "),
    createdAt: row.created_at,
  };
}
