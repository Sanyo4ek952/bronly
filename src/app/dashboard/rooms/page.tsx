import { redirect } from "next/navigation";

import { getOwnerInventory } from "@/entities/property";

import { resolveLegacyRoomsRedirect } from "./redirect-target";

export default async function LegacyRoomsPage() {
  const inventory = await getOwnerInventory();

  redirect(resolveLegacyRoomsRedirect(inventory));
}
