import type { OwnerInventoryListItem } from "@/entities/property";

type LegacyRoomsInventoryItem = Pick<OwnerInventoryListItem, "id" | "kind">;

export function resolveLegacyRoomsRedirect(inventory: LegacyRoomsInventoryItem[]) {
  if (!inventory.length) {
    return "/dashboard/rooms/new";
  }

  const firstStandaloneRoom = inventory.find((item) => item.kind === "standalone_room");

  if (firstStandaloneRoom?.kind === "standalone_room") {
    return `/dashboard/rooms/${firstStandaloneRoom.id}`;
  }

  return `/dashboard/properties/${inventory[0].id}/rooms`;
}

