"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getNumber, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyRoomPath, buildPropertyRoomSettingsPath } from "./lib/paths";

function buildRoomRedirectTarget(formData: FormData, propertyId: string, roomId: string, state: Record<string, string>) {
  const fallbackPath = buildPropertyRoomSettingsPath(propertyId, roomId);
  const redirectTo = getString(formData, "redirectTo");
  const basePath = redirectTo.startsWith("/dashboard/properties/") ? redirectTo : fallbackPath;
  const params = new URLSearchParams(state);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function createRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !roomId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_seasonal_prices").insert({
    room_id: roomId,
    starts_on: startsOn,
    ends_on: endsOn,
    price_per_night: getNumber(formData, "pricePerNight", 0),
    is_active: getCheckbox(formData, "isActive"),
  });

  if (error) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: mapActionError(error) }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyRoomPath(propertyId, roomId));
  revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-created" }));
}

export async function updateRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const seasonalPriceId = getString(formData, "seasonalPriceId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !roomId || !seasonalPriceId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("room_seasonal_prices")
    .update({
      starts_on: startsOn,
      ends_on: endsOn,
      price_per_night: getNumber(formData, "pricePerNight", 0),
      is_active: getCheckbox(formData, "isActive"),
    })
    .eq("id", seasonalPriceId);

  if (error) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: mapActionError(error) }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyRoomPath(propertyId, roomId));
  revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-saved" }));
}

export async function deleteRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const seasonalPriceId = getString(formData, "seasonalPriceId");

  if (!propertyId || !roomId || !seasonalPriceId) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "delete" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_seasonal_prices").delete().eq("id", seasonalPriceId);

  if (error) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "delete" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyRoomPath(propertyId, roomId));
  revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-deleted" }));
}
