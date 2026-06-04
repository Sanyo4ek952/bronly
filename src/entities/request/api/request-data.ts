import { cache } from "react";

import { guestRequests } from "@/entities/request/model/mock";
import type { AgentRequestItem, OwnerRequestItem } from "@/entities/request/model/types";
import {
  calculateRoomPricing,
  isRoomAvailableForDates,
  normalizePublicStayFilters,
} from "@/entities/room";
import { createNotificationEvent } from "@/entities/notification";
import { getRoomById } from "@/entities/room/model/mock";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseGuestRequestRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";
import { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";

type RequestStatus = OwnerRequestItem["status"];
type RequestSource = OwnerRequestItem["source"];

function formatFullGuestLabel(adultsCount: number, childrenCount: number) {
  const parts = [`${adultsCount} взр.`];

  if (childrenCount > 0) {
    parts.push(`${childrenCount} дет.`);
  }

  return parts.join(", ");
}

function normalizeStatus(status: SupabaseGuestRequestRow["status"] | "owner_confirmed" | "declined" | "in_progress"): RequestStatus {
  switch (status) {
    case "owner_confirmed":
      return "accepted_by_owner";
    case "declined":
      return "rejected";
    case "in_progress":
      return "transferred_to_owner";
    default:
      return status;
  }
}

function normalizeSource(source: SupabaseGuestRequestRow["source"]): RequestSource {
  return source;
}

function isAgentMediatedRequest(request: Pick<SupabaseGuestRequestRow, "agent_id" | "owner_id" | "source">) {
  return Boolean(request.agent_id) && request.agent_id !== request.owner_id && (request.source === "agent" || request.source === "collection");
}

function canOwnerReject(status: RequestStatus) {
  return status === "new" || status === "transferred_to_owner" || status === "accepted_by_owner";
}

function canOwnerComplete(status: RequestStatus) {
  return status === "accepted_by_owner";
}

async function getRoomAndPropertyMeta(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requestRows: SupabaseGuestRequestRow[],
) {
  const roomIds = [...new Set(requestRows.map((request) => request.room_id))];
  const propertyIds = [...new Set(requestRows.map((request) => request.property_id))];

  const [{ data: roomRows }, { data: propertyRows }] = await Promise.all([
    roomIds.length
      ? supabase.from("rooms").select("id, title, price_per_night").in("id", roomIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length
      ? supabase.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const roomMap = new Map(
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

function mapOwnerRequestItem(
  request: SupabaseGuestRequestRow,
  roomMeta: { title: string; pricePerNight: number } | undefined,
  propertyTitle: string | undefined,
): OwnerRequestItem {
  return {
    id: request.id,
    guestName: request.guest_name,
    phone: request.guest_phone,
    createdAt: formatDateTimeLabel(request.created_at),
    roomId: request.room_id,
    propertyTitle: propertyTitle ?? "Объект",
    roomTitle: roomMeta?.title ?? "Номер",
    source: normalizeSource(request.source),
    status: normalizeStatus(request.status),
    checkIn: formatDateLabel(request.check_in),
    checkOut: formatDateLabel(request.check_out),
    guestsLabel: formatFullGuestLabel(request.adults_count, request.children_count),
    comment: request.guest_comment ?? "",
    totalPrice: Number(request.total_price ?? request.base_price_per_night ?? roomMeta?.pricePerNight ?? 0),
    pricePerNight: roomMeta?.pricePerNight ?? Number(request.base_price_per_night ?? 0),
  };
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
      mapOwnerRequestItem(request, roomMap.get(request.room_id), propertyMap.get(request.property_id)),
    );
  } catch {
    return guestRequests;
  }
});

export async function createGuestRequest(input: {
  propertySlug: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adultsCount: number;
  guestComment: string;
  source?: RequestSource;
  agentProfileId?: string | null;
  collectionId?: string | null;
  agentMarkupPercent?: number | null;
}) {
  if (!canUseSupabase()) {
    return { ok: true, mode: "mock" as const };
  }

  const source = input.source ?? "owner";
  const filters = normalizePublicStayFilters({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adultsCount,
  });

  if (!filters.hasDates) {
    return { ok: false, reason: "validation_failed" as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data: propertyData } = await supabase
    .from("properties")
    .select("id, owner_id, title, published, is_frozen")
    .eq("slug", input.propertySlug)
    .maybeSingle();

  const propertyRow = propertyData as {
    id: string;
    owner_id: string;
    title: string;
    published: boolean;
    is_frozen: boolean;
  } | null;

  if (!propertyRow || !propertyRow.published || propertyRow.is_frozen) {
    return { ok: false, reason: "property_not_found" as const };
  }

  const subscription = await getSubscriptionRuntimeState(propertyRow.owner_id, "owner");

  if (!subscription.isRequestIntakeAllowed) {
    return { ok: false, reason: "subscription_expired" as const };
  }

  const { data: roomData } = await supabase
    .from("rooms")
    .select("id, title, price_per_night, capacity, bedrooms, is_active")
    .eq("id", input.roomId)
    .eq("property_id", propertyRow.id)
    .maybeSingle();

  const roomRow = roomData as {
    id: string;
    title: string;
    price_per_night: number;
    capacity: number;
    bedrooms: number;
    is_active: boolean;
  } | null;

  if (!roomRow || !roomRow.is_active) {
    return { ok: false, reason: "room_not_found" as const };
  }

  if (roomRow.capacity < filters.adults) {
    return { ok: false, reason: "room_not_suitable" as const };
  }

  const [{ data: seasonalRows }, { data: busyRows }] = await Promise.all([
    supabase
      .from("room_seasonal_prices")
      .select("*")
      .eq("room_id", roomRow.id)
      .eq("is_active", true)
      .order("starts_on", { ascending: true }),
    supabase
      .from("room_busy_ranges")
      .select("*")
      .eq("room_id", roomRow.id)
      .order("starts_on", { ascending: true }),
  ]);

  const seasonalPrices = ((seasonalRows ?? []) as SupabaseRoomSeasonalPriceRow[]).map(mapSeasonalPrice);
  const busyRanges = ((busyRows ?? []) as SupabaseRoomBusyRangeRow[]).map(mapBusyRange);

  if (!isRoomAvailableForDates({ busyRanges }, filters.checkIn, filters.checkOut)) {
    return { ok: false, reason: "availability_failed" as const };
  }

  const basePricePerNight = Number(roomRow.price_per_night);
  const markupPercent = Math.max(input.agentMarkupPercent ?? 0, 0);
  const ownerPricing = calculateRoomPricing(
    {
      id: roomRow.id,
      pricePerNight: basePricePerNight,
      capacity: roomRow.capacity,
      bedrooms: roomRow.bedrooms,
      seasonalPrices,
      busyRanges,
    },
    filters.checkIn,
    filters.checkOut,
  );

  const hasAgentPricing = source === "agent" || (source === "collection" && Boolean(input.agentProfileId));
  const totalPrice = hasAgentPricing
    ? ownerPricing.nightlyPrices.reduce((sum, item) => sum + item.pricePerNight * (1 + markupPercent / 100), 0)
    : ownerPricing.totalPrice;

  const { data: insertedRequest, error } = await supabase.from("guest_requests").insert({
    source,
    property_id: propertyRow.id,
    room_id: roomRow.id,
    owner_id: propertyRow.owner_id,
    agent_id: source === "agent" || source === "collection" ? input.agentProfileId ?? null : null,
    collection_id: input.collectionId ?? null,
    guest_name: input.guestName,
    guest_phone: input.guestPhone,
    guest_comment: input.guestComment,
    adults_count: filters.adults,
    children_count: 0,
    check_in: filters.checkIn,
    check_out: filters.checkOut,
    status: "new",
    base_price_per_night: basePricePerNight,
    agent_markup_percent: hasAgentPricing ? markupPercent : null,
    total_price: totalPrice,
    pricing_snapshot: {
      source,
      room_id: roomRow.id,
      property_id: propertyRow.id,
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      adults_count: filters.adults,
      nights: ownerPricing.nights,
      base_price_per_night: basePricePerNight,
      display_price_per_night: hasAgentPricing
        ? Math.round(totalPrice / Math.max(ownerPricing.nights, 1))
        : ownerPricing.displayPricePerNight,
      total_price: totalPrice,
      nightly_prices: hasAgentPricing
        ? ownerPricing.nightlyPrices.map((item) => ({
            ...item,
            pricePerNight: Number((item.pricePerNight * (1 + markupPercent / 100)).toFixed(2)),
          }))
        : ownerPricing.nightlyPrices,
      agent_markup_percent: hasAgentPricing ? markupPercent : null,
    },
  }).select("id").single();

  if (error) {
    return { ok: false, reason: "save_failed" as const };
  }

  const recipientId = hasAgentPricing ? input.agentProfileId ?? null : propertyRow.owner_id;
  const linkPath = hasAgentPricing ? "/agent/dashboard/requests" : "/dashboard/requests";

  if (recipientId) {
    await createNotificationEvent({
      recipientId,
      eventType: "new_request",
      payload: {
        requestId: insertedRequest?.id as string | undefined,
        propertyId: propertyRow.id,
        propertyTitle: propertyRow.title,
        roomTitle: roomRow.title,
        linkPath,
      },
    });
  }

  return { ok: true, mode: "supabase" as const };
}

export function getRequestRoom(roomId: string) {
  return getRoomById(roomId);
}

export async function transitionOwnerRequestStatus(input: {
  requestId: string;
  nextStatus: Extract<RequestStatus, "accepted_by_owner" | "rejected" | "completed">;
}) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("guest_requests").select("*").eq("id", input.requestId).maybeSingle();
  const request = data as SupabaseGuestRequestRow | null;

  if (!request || request.owner_id !== profile.id) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const currentStatus = normalizeStatus(request.status);
  const isTransferredAgentRequest =
    (request.source === "agent" || (request.source === "collection" && isAgentMediatedRequest(request))) &&
    currentStatus === "transferred_to_owner";
  const isOwnerDirectRequest =
    (request.source === "owner" || (request.source === "collection" && !isAgentMediatedRequest(request))) &&
    currentStatus === "new";
  const allowed =
    (input.nextStatus === "accepted_by_owner" && (isOwnerDirectRequest || isTransferredAgentRequest)) ||
    (input.nextStatus === "rejected" &&
      (((request.source === "owner" || (request.source === "collection" && !isAgentMediatedRequest(request))) &&
        canOwnerReject(currentStatus)) ||
        ((request.source === "agent" || (request.source === "collection" && isAgentMediatedRequest(request))) &&
          (currentStatus === "transferred_to_owner" || currentStatus === "accepted_by_owner")))) ||
    (input.nextStatus === "completed" && canOwnerComplete(currentStatus));

  if (!allowed) {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const payload: Partial<SupabaseGuestRequestRow> & Record<string, string | null> = {
    status: input.nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (input.nextStatus === "accepted_by_owner") {
    payload.owner_confirmed_at = new Date().toISOString();
  }

  if (input.nextStatus === "completed") {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("guest_requests").update(payload).eq("id", input.requestId);

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function transferAgentRequestToOwner(input: { requestId: string }) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("guest_requests").select("*").eq("id", input.requestId).maybeSingle();
  const request = data as SupabaseGuestRequestRow | null;

  if (
    !request ||
    request.agent_id !== profile.id ||
    (request.source !== "agent" && request.source !== "collection")
  ) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const currentStatus = normalizeStatus(request.status);

  if (currentStatus !== "new") {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const { error } = await supabase
    .from("guest_requests")
    .update({
      status: "transferred_to_owner",
      transferred_to_owner_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.requestId);

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  const admin = createSupabaseAdminClient();
  const [{ data: propertyData }, { data: roomData }] = await Promise.all([
    admin.from("properties").select("title").eq("id", request.property_id).maybeSingle(),
    admin.from("rooms").select("title").eq("id", request.room_id).maybeSingle(),
  ]);

  await createNotificationEvent({
    recipientId: request.owner_id,
    eventType: "request_transferred_to_owner",
    payload: {
      requestId: request.id,
      propertyId: request.property_id,
      propertyTitle: (propertyData?.title as string | null) ?? undefined,
      roomTitle: (roomData?.title as string | null) ?? undefined,
      linkPath: "/dashboard/requests",
    },
  });

  return { ok: true as const };
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
    const propertyIds = [...new Set(safeRows.map((request) => request.property_id))];
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

    return safeRows.map((request) => {
      const status = normalizeStatus(request.status);

      return {
        id: request.id,
        propertyTitle: propertyMap.get(request.property_id) ?? "Объект",
        roomTitle: roomMap.get(request.room_id) ?? "Номер",
        guestName: request.guest_name,
        createdAt: formatDateTimeLabel(request.created_at),
        source: request.source,
        status,
        canTransferToOwner: status === "new" && request.owner_id !== profile.id,
      };
    });
  } catch {
    return [];
  }
}
