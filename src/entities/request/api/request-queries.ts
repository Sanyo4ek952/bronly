import { cache } from "react";

import { guestRequests } from "@/entities/request/model/mock";
import type { AgentRequestItem, OwnerRequestItem } from "@/entities/request/model/types";
import { getRoomById } from "@/entities/room/model/mock";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient } from "@/shared/api/supabase/server-auth";
import type { SupabaseGuestRequestRow } from "@/shared/api/supabase/types";

import { mapAgentRequestItem, mapOwnerRequestItem, type RequestRoomMeta } from "./request-mappers";
import { isAgentMediatedRequest, normalizeStatus } from "./request-rules";

export async function getRoomAndPropertyMeta(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requestRows: SupabaseGuestRequestRow[],
) {
  const roomIds = [...new Set(requestRows.map((request) => request.room_id))];
  const propertyIds = [...new Set(requestRows.map((request) => request.property_id).filter((value): value is string => Boolean(value)))];

  const [{ data: roomRows }, { data: propertyRows }] = await Promise.all([
    roomIds.length
      ? supabase.from("rooms").select("id, title, price_per_night").in("id", roomIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length
      ? supabase.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const roomMap = new Map<string, RequestRoomMeta>(
    (roomRows ?? []).map((room) => [
      room.id as string,
      {
        title: room.title as string,
        pricePerNight: Number(room.price_per_night ?? 0),
      },
    ]),
  );
  const propertyMap = new Map((propertyRows ?? []).map((property) => [property.id as string, property.title as string]));

  return { roomMap, propertyMap };
}

export const getOwnerRequests = cache(async (): Promise<OwnerRequestItem[]> => {
  if (!canUseSupabase()) {
    return guestRequests;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: requestRows } = await supabase
      .from("guest_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const safeRows = ((requestRows ?? []) as SupabaseGuestRequestRow[]).filter(
      (request) => !(isAgentMediatedRequest(request) && normalizeStatus(request.status) === "new"),
    );
    const { roomMap, propertyMap } = await getRoomAndPropertyMeta(supabase, safeRows);

    return safeRows.map((request) =>
      mapOwnerRequestItem(request, roomMap.get(request.room_id), propertyMap.get(request.property_id ?? "")),
    );
  } catch {
    return guestRequests;
  }
});

export function getRequestRoom(roomId: string) {
  return getRoomById(roomId);
}

export async function getAgentRequests(profile: { id: string }): Promise<AgentRequestItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: requestRows } = await supabase
      .from("guest_requests")
      .select("*")
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const safeRows = ((requestRows ?? []) as SupabaseGuestRequestRow[]).filter(
      (request): request is SupabaseGuestRequestRow & { source: "agent" | "collection" } =>
        request.source === "agent" || request.source === "collection",
    );
    const roomIds = [...new Set(safeRows.map((request) => request.room_id))];
    const propertyIds = [...new Set(safeRows.map((request) => request.property_id).filter((value): value is string => Boolean(value)))];
    const [{ data: roomRows }, { data: propertyRows }] = await Promise.all([
      roomIds.length
        ? supabase.from("rooms").select("id, title").in("id", roomIds)
        : Promise.resolve({ data: [] }),
      propertyIds.length
        ? supabase.from("properties").select("id, title").in("id", propertyIds)
        : Promise.resolve({ data: [] }),
    ]);

    const roomMap = new Map((roomRows ?? []).map((room) => [room.id as string, room.title as string]));
    const propertyMap = new Map((propertyRows ?? []).map((property) => [property.id as string, property.title as string]));

    return safeRows.map((request) =>
      mapAgentRequestItem(request, profile.id, roomMap.get(request.room_id), propertyMap.get(request.property_id ?? "")),
    );
  } catch {
    return [];
  }
}
