"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getNumber, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState } from "./lib/paths";

export async function createRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !roomId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "validation" }));
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
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: mapActionError(error) }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "season-created" }));
}

export async function updateRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const seasonalPriceId = getString(formData, "seasonalPriceId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !seasonalPriceId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "validation" }));
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
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: mapActionError(error) }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "season-saved" }));
}

export async function deleteRoomSeasonalPrice(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const seasonalPriceId = getString(formData, "seasonalPriceId");

  if (!propertyId || !seasonalPriceId) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_seasonal_prices").delete().eq("id", seasonalPriceId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "season-deleted" }));
}
