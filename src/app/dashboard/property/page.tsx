import { redirect } from "next/navigation";

import { getOwnerInventory, getOwnerProperties } from "@/entities/property";

export default async function LegacyPropertyPage() {
  const [properties, inventory] = await Promise.all([getOwnerProperties(), getOwnerInventory()]);

  if (!inventory.length) {
    redirect("/dashboard/properties");
  }

  if (!properties.length) {
    const standaloneRoom = inventory.find((item) => item.kind === "standalone_room");

    if (standaloneRoom?.kind === "standalone_room") {
      redirect(`/dashboard/properties?roomId=${encodeURIComponent(standaloneRoom.id)}`);
    }
  }

  redirect(`/dashboard/properties/${properties[0].id}`);
}
