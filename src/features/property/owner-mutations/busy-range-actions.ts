"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getString } from "@/shared/lib/form-data";

import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState } from "./lib/paths";

export async function createRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const roomId = getString(formData, "roomId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !roomId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_busy_ranges").insert({
    room_id: roomId,
    starts_on: startsOn,
    ends_on: endsOn,
    source: "manual",
    label: getString(formData, "label") || null,
    note: getString(formData, "note") || null,
  });

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "save" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-created" }));
}

export async function updateRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const busyRangeId = getString(formData, "busyRangeId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !busyRangeId || !startsOn || !endsOn || startsOn > endsOn) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("room_busy_ranges")
    .update({
      starts_on: startsOn,
      ends_on: endsOn,
      label: getString(formData, "label") || null,
      note: getString(formData, "note") || null,
    })
    .eq("id", busyRangeId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "save" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-saved" }));
}

export async function deleteRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const busyRangeId = getString(formData, "busyRangeId");

  if (!propertyId || !busyRangeId) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "delete" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_busy_ranges").delete().eq("id", busyRangeId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "calendar", { error: "delete" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-deleted" }));
}
