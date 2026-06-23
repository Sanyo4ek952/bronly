import {
  calculateRoomPricing,
  isRoomAvailableForDates,
  normalizePublicStayFilters,
} from "@/entities/room";
import { createNotificationEvent } from "@/entities/notification";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseGuestRequestRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";

import { canOwnerComplete, canOwnerReject, isAgentMediatedRequest, normalizeStatus, type RequestSource, type RequestStatus } from "./request-rules";

export async function createGuestRequest(input: {
  publicSlug?: string;
  propertySlug?: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adultsCount: number;
  roomsCount: number;
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
    rooms: input.roomsCount,
  });

  if (!filters.hasDates) {
    return { ok: false, reason: "validation_failed" as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data: roomData } = await supabase
    .from("rooms")
    .select("id, owner_id, property_id, room_kind, title, price_per_night, capacity, bedrooms, is_active")
    .eq("id", input.roomId)
    .maybeSingle();

  const roomRow = roomData as {
    id: string;
    owner_id: string;
    property_id: string | null;
    room_kind: "property_room" | "standalone_room";
    title: string;
    price_per_night: number;
    capacity: number;
    bedrooms: number;
    is_active: boolean;
  } | null;

  if (!roomRow || !roomRow.is_active) {
    return { ok: false, reason: "room_not_found" as const };
  }

  const propertyRow = roomRow.property_id
    ? ((await supabase
        .from("properties")
        .select("id, owner_id, slug, title, published, is_frozen")
        .eq("id", roomRow.property_id)
        .maybeSingle()).data as {
        id: string;
        owner_id: string;
        slug: string;
        title: string;
        published: boolean;
        is_frozen: boolean;
      } | null)
    : null;

  if (roomRow.room_kind === "property_room") {
    if (!propertyRow || !propertyRow.published || propertyRow.is_frozen) {
      return { ok: false, reason: "property_not_found" as const };
    }

    if (input.propertySlug && propertyRow.slug !== input.propertySlug) {
      return { ok: false, reason: "property_not_found" as const };
    }
  }

  const subscription = await getSubscriptionRuntimeState(roomRow.owner_id, "owner");

  if (!subscription.isRequestIntakeAllowed) {
    return { ok: false, reason: "subscription_expired" as const };
  }

  const { data: ownerProfileData } = await supabase
    .from("profiles")
    .select("is_public_hidden_by_admin")
    .eq("id", roomRow.owner_id)
    .maybeSingle();

  if (ownerProfileData?.is_public_hidden_by_admin) {
    return { ok: false, reason: "property_not_found" as const };
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
    ? Number(
        ownerPricing.nightlyPrices
          .reduce((sum, item) => sum + item.pricePerNight * (1 + markupPercent / 100), 0)
          .toFixed(2),
      )
    : ownerPricing.totalPrice;

  const { data: insertedRequest, error } = await supabase.from("guest_requests").insert({
    source,
    property_id: propertyRow?.id ?? null,
    room_id: roomRow.id,
    owner_id: roomRow.owner_id,
    agent_id: source === "agent" || source === "collection" ? input.agentProfileId ?? null : null,
    collection_id: input.collectionId ?? null,
    guest_name: input.guestName,
    guest_phone: input.guestPhone,
    guest_comment: input.guestComment,
    adults_count: filters.adults,
    children_count: 0,
    rooms_count: filters.rooms,
    check_in: filters.checkIn,
    check_out: filters.checkOut,
    status: "new",
    base_price_per_night: basePricePerNight,
    agent_markup_percent: hasAgentPricing ? markupPercent : null,
    total_price: totalPrice,
    pricing_snapshot: {
      source,
      room_id: roomRow.id,
      property_id: propertyRow?.id ?? null,
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      adults_count: filters.adults,
      rooms_count: filters.rooms,
      nights: ownerPricing.nights,
      base_price_per_night: basePricePerNight,
      display_price_per_night: hasAgentPricing
        ? Number((totalPrice / Math.max(ownerPricing.nights, 1)).toFixed(2))
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

  const recipientId = hasAgentPricing ? input.agentProfileId ?? null : roomRow.owner_id;
  const linkPath = hasAgentPricing ? "/agent/dashboard/requests" : "/dashboard/requests";

  if (recipientId) {
    await createNotificationEvent({
      recipientId,
      eventType: "new_request",
      payload: {
        requestId: insertedRequest?.id as string | undefined,
        propertyId: propertyRow?.id ?? undefined,
        propertyTitle: propertyRow?.title ?? roomRow.title,
        roomTitle: roomRow.title,
        linkPath,
      },
    });
  }

  return { ok: true, mode: "supabase" as const };
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
    request.property_id ? admin.from("properties").select("title").eq("id", request.property_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("rooms").select("title").eq("id", request.room_id).maybeSingle(),
  ]);

  await createNotificationEvent({
    recipientId: request.owner_id,
    eventType: "request_transferred_to_owner",
    payload: {
      requestId: request.id,
      propertyId: request.property_id ?? undefined,
      propertyTitle: (propertyData?.title as string | null) ?? undefined,
      roomTitle: (roomData?.title as string | null) ?? undefined,
      linkPath: "/dashboard/requests",
    },
  });

  return { ok: true as const };
}

export async function requestAgentCompletion(input: { requestId: string }) {
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

  if (!request || request.agent_id !== profile.id || (request.source !== "agent" && request.source !== "collection")) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const currentStatus = normalizeStatus(request.status);

  if (currentStatus !== "accepted_by_owner") {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  if (request.completion_requested_at) {
    return { ok: true as const };
  }

  const requestedAt = new Date().toISOString();
  const { error } = await supabase
    .from("guest_requests")
    .update({
      completion_requested_at: requestedAt,
      updated_at: requestedAt,
    })
    .eq("id", input.requestId);

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  const admin = createSupabaseAdminClient();
  const [{ data: propertyData }, { data: roomData }] = await Promise.all([
    request.property_id ? admin.from("properties").select("title").eq("id", request.property_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("rooms").select("title").eq("id", request.room_id).maybeSingle(),
  ]);

  await createNotificationEvent({
    recipientId: request.owner_id,
    eventType: "request_completion_requested",
    payload: {
      requestId: request.id,
      propertyId: request.property_id ?? undefined,
      propertyTitle: (propertyData?.title as string | null) ?? undefined,
      roomTitle: (roomData?.title as string | null) ?? undefined,
      linkPath: "/dashboard/requests",
    },
  });

  return { ok: true as const };
}
