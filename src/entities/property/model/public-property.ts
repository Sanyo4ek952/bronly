import type { PublicRoom } from "@/entities/room";

export type PublicPropertyDetailMode = "compact" | "hospitality_detailed";

const HOSPITALITY_PROPERTY_TYPE_MARKERS = ["гостевой дом", "мини-отель"] as const;

function normalizePropertyType(value: string) {
  return value.trim().toLowerCase();
}

export function resolvePublicPropertyDetailMode(propertyType: string): PublicPropertyDetailMode {
  const normalized = normalizePropertyType(propertyType);

  return HOSPITALITY_PROPERTY_TYPE_MARKERS.some((marker) => normalized.includes(marker))
    ? "hospitality_detailed"
    : "compact";
}

export function aggregateRoomAmenities(rooms: PublicRoom[]) {
  const uniqueAmenities = new Set<string>();

  for (const room of rooms) {
    for (const amenity of room.amenities) {
      const normalized = amenity.trim();
      if (!normalized || uniqueAmenities.has(normalized)) {
        continue;
      }

      uniqueAmenities.add(normalized);
    }
  }

  return Array.from(uniqueAmenities);
}
