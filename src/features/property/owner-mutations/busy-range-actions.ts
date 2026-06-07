"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getString } from "@/shared/lib/form-data";

import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState } from "./lib/paths";

function redirectWithCalendarError(propertyId: string, error: "validation" | "save" | "delete" | "overlap"): never {
  redirect(buildPropertyPathWithState(propertyId, "calendar", { error }));
}

async function getOwnedRoomForCalendar(propertyId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, property_id")
    .eq("id", roomId)
    .eq("property_id", propertyId)
    .maybeSingle();

  return data;
}

async function getOwnedBusyRange(propertyId: string, busyRangeId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("room_busy_ranges")
    .select("id, room_id")
    .eq("id", busyRangeId)
    .maybeSingle();

  if (!data?.room_id) {
    return null;
  }

  const room = await getOwnedRoomForCalendar(propertyId, data.room_id as string);

  if (!room) {
    return null;
  }

  return {
    id: data.id as string,
    roomId: data.room_id as string,
  };
}

async function hasBusyRangeOverlap(input: {
  roomId: string;
  startsOn: string;
  endsOn: string;
  excludedBusyRangeId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("room_busy_ranges")
    .select("id")
    .eq("room_id", input.roomId)
    .lte("starts_on", input.endsOn)
    .gte("ends_on", input.startsOn)
    .limit(1);

  if (input.excludedBusyRangeId) {
    query = query.neq("id", input.excludedBusyRangeId);
  }

  const { data } = await query;
  return Boolean(data?.length);
}

function revalidateOwnerCalendarPaths(propertyId: string) {
  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyPath(propertyId, "calendar"));
}

export async function createRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const roomId = getString(formData, "roomId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !roomId || !startsOn || !endsOn || startsOn > endsOn) {
    redirectWithCalendarError(propertyId, "validation");
  }

  const room = await getOwnedRoomForCalendar(propertyId, roomId);

  if (!room) {
    redirectWithCalendarError(propertyId, "save");
  }

  if (await hasBusyRangeOverlap({ roomId, startsOn, endsOn })) {
    redirectWithCalendarError(propertyId, "overlap");
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
    redirectWithCalendarError(propertyId, "save");
  }

  revalidateOwnerCalendarPaths(propertyId);
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-created" }));
}

export async function updateRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const busyRangeId = getString(formData, "busyRangeId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!propertyId || !busyRangeId || !startsOn || !endsOn || startsOn > endsOn) {
    redirectWithCalendarError(propertyId, "validation");
  }

  const busyRange = await getOwnedBusyRange(propertyId, busyRangeId);

  if (!busyRange) {
    redirectWithCalendarError(propertyId, "save");
  }

  if (await hasBusyRangeOverlap({ roomId: busyRange.roomId, startsOn, endsOn, excludedBusyRangeId: busyRangeId })) {
    redirectWithCalendarError(propertyId, "overlap");
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
    .eq("id", busyRangeId)
    .eq("room_id", busyRange.roomId);

  if (error) {
    redirectWithCalendarError(propertyId, "save");
  }

  revalidateOwnerCalendarPaths(propertyId);
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-saved" }));
}

export async function deleteRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "calendar"));
  const busyRangeId = getString(formData, "busyRangeId");

  if (!propertyId || !busyRangeId) {
    redirectWithCalendarError(propertyId, "delete");
  }

  const busyRange = await getOwnedBusyRange(propertyId, busyRangeId);

  if (!busyRange) {
    redirectWithCalendarError(propertyId, "delete");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("room_busy_ranges")
    .delete()
    .eq("id", busyRangeId)
    .eq("room_id", busyRange.roomId);

  if (error) {
    redirectWithCalendarError(propertyId, "delete");
  }

  revalidateOwnerCalendarPaths(propertyId);
  redirect(buildPropertyPathWithState(propertyId, "calendar", { success: "busy-deleted" }));
}
