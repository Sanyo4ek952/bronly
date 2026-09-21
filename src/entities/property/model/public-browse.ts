import type { PublicRoom } from "@/entities/room/model/types";
import type { PublicStayFilters } from "@/entities/room/model/pricing";
import type { PublicPropertySummary } from "./types";

export type PublicBrowseSection = {
  property: PublicPropertySummary;
  rooms: PublicRoom[];
  sourceKinds?: Array<"property" | "room">;
};

export function summarizePublicProperty(rooms: PublicRoom[], filters: PublicStayFilters) {
  const active = rooms.filter((room) => room.status === "active");
  const suitable = active.filter((room) => room.isAvailableForFilter);
  const prices = (filters.hasDates ? suitable : active)
    .map((room) => filters.hasDates ? room.totalPrice : room.displayPricePerNight ?? room.pricePerNight)
    .filter((price): price is number => price != null && Number.isFinite(price));
  return {
    roomCount: active.length,
    suitableCount: suitable.length,
    minPrice: prices.length ? Math.min(...prices) : null,
  };
}

export function sortPublicProperties<T extends PublicBrowseSection>(sections: T[]) {
  return [...sections].sort((a, b) =>
    Number(b.rooms.some((room) => room.status === "active" && room.isAvailableForFilter)) -
    Number(a.rooms.some((room) => room.status === "active" && room.isAvailableForFilter)),
  );
}

// Only search the authorized storefront snapshot, never the global inventory.
export function findPublicDetail(
  sections: PublicBrowseSection[],
  standaloneRooms: PublicRoom[],
  kind: "properties" | "rooms",
  id: string,
) {
  if (kind === "properties") {
    const section = sections.find((item) => item.property.id === id);
    return section ? { section, room: null } : null;
  }
  for (const section of sections) {
    const room = section.rooms.find((item) => item.id === id && item.status === "active");
    if (room) return { section, room };
  }
  const room = standaloneRooms.find((item) => item.id === id && item.status === "active");
  return room ? { section: null, room } : null;
}
