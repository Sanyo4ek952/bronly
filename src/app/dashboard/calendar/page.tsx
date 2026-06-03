import { redirect } from "next/navigation";

import { getOwnerProperties } from "@/entities/property";

export default async function LegacyCalendarPage() {
  const properties = await getOwnerProperties();

  if (!properties.length) {
    redirect("/dashboard/properties/new");
  }

  redirect(`/dashboard/properties/${properties[0].id}/calendar`);
}
