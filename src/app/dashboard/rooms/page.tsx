import { redirect } from "next/navigation";

import { getOwnerInventory } from "@/entities/property";

export default async function LegacyRoomsPage() {
  const inventory = await getOwnerInventory();

  if (!inventory.length) {
    redirect("/dashboard/rooms/new");
  }

  const firstStandaloneRoom = inventory.find((item) => item.kind === "standalone_room");

  if (firstStandaloneRoom?.kind === "standalone_room") {
    redirect(`/dashboard/properties?roomId=${encodeURIComponent(firstStandaloneRoom.id)}`);
  }

  redirect(`/dashboard/properties/${inventory[0].id}/rooms`);
}
