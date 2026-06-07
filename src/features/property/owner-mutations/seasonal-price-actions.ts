"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getNumber, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { requireOwnerMutationAccess } from "./lib/owner-access";
import {
  buildPropertyPath,
  buildPropertyRoomPath,
  buildPropertyRoomSettingsPath,
  buildStandaloneRoomPath,
  buildStandaloneRoomSettingsPath,
} from "./lib/paths";

function buildRoomRedirectTarget(formData: FormData, propertyId: string, roomId: string, state: Record<string, string>) {
  const fallbackPath = propertyId ? buildPropertyRoomSettingsPath(propertyId, roomId) : buildStandaloneRoomSettingsPath(roomId);
  const redirectTo = getString(formData, "redirectTo");
  const basePath =
    redirectTo.startsWith("/dashboard/properties/") ||
    redirectTo.startsWith("/dashboard/properties?") ||
    redirectTo.startsWith("/dashboard/rooms/")
      ? redirectTo
      : fallbackPath;
  const params = new URLSearchParams(state);
  const query = params.toString();

  if (!query) {
    return basePath;
  }

  return `${basePath}${basePath.includes("?") ? "&" : "?"}${query}`;
}

export async function createRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId));
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!roomId || !startsOn || !endsOn || startsOn > endsOn) {
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

  if (propertyId) {
    revalidatePath(buildPropertyPath(propertyId));
    revalidatePath(buildPropertyRoomPath(propertyId, roomId));
    revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  } else {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomSettingsPath(roomId));
  }
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-created" }));
}

export async function updateRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId));
  const seasonalPriceId = getString(formData, "seasonalPriceId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!roomId || !seasonalPriceId || !startsOn || !endsOn || startsOn > endsOn) {
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

  if (propertyId) {
    revalidatePath(buildPropertyPath(propertyId));
    revalidatePath(buildPropertyRoomPath(propertyId, roomId));
    revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  } else {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomSettingsPath(roomId));
  }
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-saved" }));
}

export async function deleteRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId));
  const seasonalPriceId = getString(formData, "seasonalPriceId");

  if (!roomId || !seasonalPriceId) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "delete" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_seasonal_prices").delete().eq("id", seasonalPriceId);

  if (error) {
    redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { error: "delete" }));
  }

  if (propertyId) {
    revalidatePath(buildPropertyPath(propertyId));
    revalidatePath(buildPropertyRoomPath(propertyId, roomId));
    revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  } else {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomSettingsPath(roomId));
  }
  redirect(buildRoomRedirectTarget(formData, propertyId, roomId, { success: "season-deleted" }));
}
