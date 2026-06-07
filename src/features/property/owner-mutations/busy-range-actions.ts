"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getString } from "@/shared/lib/form-data";

import { requireOwnerMutationAccess } from "./lib/owner-access";
import {
  buildPropertyPath,
  buildPropertyPathWithState,
  buildStandaloneRoomCalendarPath,
  buildStandaloneRoomPath,
} from "./lib/paths";

function buildCalendarRedirectPath(propertyId: string, roomId: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  const basePath = propertyId ? buildPropertyPath(propertyId, "calendar") : buildStandaloneRoomCalendarPath(roomId);
  return query ? `${basePath}?${query}` : basePath;
}

function redirectWithCalendarError(propertyId: string, roomId: string, error: "validation" | "save" | "delete" | "overlap"): never {
  redirect(buildCalendarRedirectPath(propertyId, roomId, { error }));
}

async function getOwnedRoomForCalendar(roomId: string, propertyId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("rooms").select("id, property_id, owner_id").eq("id", roomId);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data } = await query.maybeSingle();
  return data;
}

async function getOwnedBusyRange(roomId: string, busyRangeId: string, propertyId?: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("room_busy_ranges").select("id, room_id").eq("id", busyRangeId).maybeSingle();

  if (!data?.room_id) {
    return null;
  }

  const room = await getOwnedRoomForCalendar(data.room_id as string, propertyId);

  if (!room || room.id !== roomId) {
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

function revalidateOwnerCalendarPaths(propertyId: string, roomId: string) {
  if (propertyId) {
    revalidatePath(buildPropertyPath(propertyId));
    revalidatePath(buildPropertyPath(propertyId, "calendar"));
  } else {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomCalendarPath(roomId));
  }
}

export async function createRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "calendar") : buildStandaloneRoomCalendarPath(roomId));
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!roomId || !startsOn || !endsOn || startsOn > endsOn) {
    redirectWithCalendarError(propertyId, roomId, "validation");
  }

  const room = await getOwnedRoomForCalendar(roomId, propertyId || undefined);

  if (!room) {
    redirectWithCalendarError(propertyId, roomId, "save");
  }

  if (await hasBusyRangeOverlap({ roomId, startsOn, endsOn })) {
    redirectWithCalendarError(propertyId, roomId, "overlap");
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
    redirectWithCalendarError(propertyId, roomId, "save");
  }

  revalidateOwnerCalendarPaths(propertyId, roomId);
  redirect(buildCalendarRedirectPath(propertyId, roomId, { success: "busy-created" }));
}

export async function updateRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "calendar") : buildStandaloneRoomCalendarPath(roomId));
  const busyRangeId = getString(formData, "busyRangeId");
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!roomId || !busyRangeId || !startsOn || !endsOn || startsOn > endsOn) {
    redirectWithCalendarError(propertyId, roomId, "validation");
  }

  const busyRange = await getOwnedBusyRange(roomId, busyRangeId, propertyId || undefined);

  if (!busyRange) {
    redirectWithCalendarError(propertyId, roomId, "save");
  }

  if (await hasBusyRangeOverlap({ roomId: busyRange.roomId, startsOn, endsOn, excludedBusyRangeId: busyRangeId })) {
    redirectWithCalendarError(propertyId, roomId, "overlap");
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
    redirectWithCalendarError(propertyId, roomId, "save");
  }

  revalidateOwnerCalendarPaths(propertyId, roomId);
  redirect(buildCalendarRedirectPath(propertyId, roomId, { success: "busy-saved" }));
}

export async function deleteRoomBusyRange(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyPath(propertyId, "calendar") : buildStandaloneRoomCalendarPath(roomId));
  const busyRangeId = getString(formData, "busyRangeId");

  if (!roomId || !busyRangeId) {
    redirectWithCalendarError(propertyId, roomId, "delete");
  }

  const busyRange = await getOwnedBusyRange(roomId, busyRangeId, propertyId || undefined);

  if (!busyRange) {
    redirectWithCalendarError(propertyId, roomId, "delete");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_busy_ranges").delete().eq("id", busyRangeId).eq("room_id", busyRange.roomId);

  if (error) {
    redirectWithCalendarError(propertyId, roomId, "delete");
  }

  revalidateOwnerCalendarPaths(propertyId, roomId);
  redirect(buildCalendarRedirectPath(propertyId, roomId, { success: "busy-deleted" }));
}
