import { cache } from "react";

import type { AgentRequestItem, OwnerRequestItem } from "@/entities/request/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { createSupabaseServerClient } from "@/shared/api/supabase/server-auth";
import type { SupabaseGuestRequestRow } from "@/shared/api/supabase/types";
import { canAccessAgentMutations } from "@/shared/api/supabase/access-rules";
import type { AuthProfile } from "@/shared/api/supabase/server-auth";

import { mapAgentRequestItem, mapOwnerRequestItem, type RequestRoomMeta } from "./request-mappers";
import { isAgentMediatedRequest, normalizeStatus } from "./request-rules";

export async function getRoomAndPropertyMeta(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requestRows: SupabaseGuestRequestRow[],
) {
  const roomIds = [...new Set(requestRows.map((request) => request.room_id))];
  const propertyIds = [...new Set(requestRows.map((request) => request.property_id).filter((value): value is string => Boolean(value)))];

  const [roomResult, propertyResult] = await Promise.all([
    roomIds.length
      ? supabase.from("rooms").select("id, title, price_per_night").in("id", roomIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (roomResult.error) {
    throw roomResult.error;
  }

  if (propertyResult.error) {
    throw propertyResult.error;
  }

  const roomRows = roomResult.data;
  const propertyRows = propertyResult.data;

  const roomMap = new Map<string, RequestRoomMeta>(
    (roomRows ?? []).map((room) => [
      room.id,
      {
        title: room.title,
        pricePerNight: Number(room.price_per_night ?? 0),
      },
    ]),
  );
  const propertyMap = new Map((propertyRows ?? []).map((property) => [property.id, property.title]));

  return { roomMap, propertyMap };
}

export const getOwnerRequests = cache(async (): Promise<OwnerRequestItem[] | null> => {
  if (!canUseSupabase()) {
    logServerConfigurationError("owner_requests_supabase_not_configured");
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: requestRows, error: requestError } = await supabase
      .from("guest_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      throw requestError;
    }

    const safeRows = (requestRows ?? []).filter(
      (request) => !(isAgentMediatedRequest(request) && normalizeStatus(request.status) === "new"),
    );
    const { roomMap, propertyMap } = await getRoomAndPropertyMeta(supabase, safeRows);

    return safeRows.map((request) =>
      mapOwnerRequestItem(request, roomMap.get(request.room_id), propertyMap.get(request.property_id ?? "")),
    );
  } catch (error) {
    logServerDataError("owner_requests_load_failed", error);
    return null;
  }
});

export async function getAgentRequests(profile: AuthProfile): Promise<AgentRequestItem[] | null> {
  if (!canAccessAgentMutations(profile)) {
    return null;
  }

  if (!canUseSupabase()) {
    logServerConfigurationError("agent_requests_supabase_not_configured");
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: requestRows, error: requestError } = await supabase
      .from("guest_requests")
      .select("*")
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (requestError) {
      throw requestError;
    }

    const safeRows = (requestRows ?? []).filter(
      (request): request is SupabaseGuestRequestRow & { source: "agent" | "collection" } =>
        request.source === "agent" || request.source === "collection",
    );
    const roomIds = [...new Set(safeRows.map((request) => request.room_id))];
    const propertyIds = [...new Set(safeRows.map((request) => request.property_id).filter((value): value is string => Boolean(value)))];
    const [roomResult, propertyResult] = await Promise.all([
      roomIds.length
        ? supabase.from("rooms").select("id, title").in("id", roomIds)
        : Promise.resolve({ data: [], error: null }),
      propertyIds.length
        ? supabase.from("properties").select("id, title").in("id", propertyIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (roomResult.error) {
      throw roomResult.error;
    }

    if (propertyResult.error) {
      throw propertyResult.error;
    }

    const roomRows = roomResult.data;
    const propertyRows = propertyResult.data;

    const roomMap = new Map((roomRows ?? []).map((room) => [room.id, room.title]));
    const propertyMap = new Map((propertyRows ?? []).map((property) => [property.id, property.title]));

    return safeRows.map((request) =>
      mapAgentRequestItem(request, profile.id, roomMap.get(request.room_id), propertyMap.get(request.property_id ?? "")),
    );
  } catch (error) {
    logServerDataError("agent_requests_load_failed", error);
    return null;
  }
}
