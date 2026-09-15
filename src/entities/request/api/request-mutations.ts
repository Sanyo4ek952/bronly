import {
  calculateRoomPricing,
  isRoomAvailableForDates,
  normalizePublicStayFilters,
} from "@/entities/room";
import { getCollectionRequestContextFailure, isRoomIncludedInCollection } from "@/entities/collection";
import { buildNotificationIdempotencyKey, createNotificationEvent } from "@/entities/notification";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";
import {
  canAgentManageRequest,
  canManageOwnedResource,
  isValidPublicGuestRequestPayload,
} from "@/shared/api/supabase/access-rules";
import type { GuestRequestFailureReason } from "@/entities/request/model/request-result";

import {
  canAgentRequestCompletion,
  canAgentTransferRequest,
  canOwnerTransitionRequestStatus,
  getAgentPublicRequestContextFailure,
  getOwnerPublicRequestContextFailure,
  isGuestRequestSubscriptionAllowed,
  normalizeStatus,
  type RequestSource,
  type RequestStatus,
} from "./request-rules";

type CreateGuestRequestInput = {
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
};

type CreateGuestRequestResult =
  | { ok: true; mode: "supabase" }
  | { ok: false; reason: GuestRequestFailureReason };

type GuestRequestPropertyRow = {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  published: boolean;
  is_frozen: boolean;
};

export async function createGuestRequest(input: CreateGuestRequestInput): Promise<CreateGuestRequestResult> {
  const source = input.source ?? "owner";

  if (!isValidPublicGuestRequestPayload({ ...input, source })) {
    return { ok: false, reason: "validation_failed" };
  }

  if (!canUseSupabase()) {
    logServerConfigurationError("guest_request_supabase_not_configured", {
      source: input.source ?? "owner",
    });
    return { ok: false, reason: "service_unavailable" };
  }

  try {
    return await createGuestRequestWithSupabase(input);
  } catch (error) {
    logServerDataError("guest_request_unhandled_data_error", error, {
      source: input.source ?? "owner",
    });
    return { ok: false, reason: "service_unavailable" };
  }
}

async function createGuestRequestWithSupabase(input: CreateGuestRequestInput): Promise<CreateGuestRequestResult> {
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
  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select("id, owner_id, property_id, room_kind, title, price_per_night, capacity, bedrooms, is_active")
    .eq("id", input.roomId)
    .maybeSingle();

  if (roomError) {
    throw roomError;
  }

  const roomRow = roomData;

  if (!roomRow || !roomRow.is_active) {
    return { ok: false, reason: "room_not_found" as const };
  }

  let propertyRow: GuestRequestPropertyRow | null = null;

  if (roomRow.property_id) {
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id, slug, title, published, is_frozen")
      .eq("id", roomRow.property_id)
      .maybeSingle();

    if (propertyError) {
      throw propertyError;
    }

    propertyRow = propertyData;
  }

  if (source !== "owner" && roomRow.room_kind === "property_room") {
    if (!propertyRow || !propertyRow.published || propertyRow.is_frozen) {
      return { ok: false, reason: "property_not_found" as const };
    }

    if (input.propertySlug && propertyRow.slug !== input.propertySlug) {
      return { ok: false, reason: "property_not_found" as const };
    }
  }

  const { data: ownerProfileData, error: ownerProfileError } = await supabase
    .from("profiles")
    .select("slug, is_public_hidden_by_admin")
    .eq("id", roomRow.owner_id)
    .maybeSingle();

  if (ownerProfileError) {
    throw ownerProfileError;
  }

  if (source === "owner") {
    const contextFailure = getOwnerPublicRequestContextFailure({
      publicSlug: input.publicSlug,
      propertySlug: input.propertySlug,
      adultsCount: filters.adults,
      roomsCount: filters.rooms,
      owner: ownerProfileData
        ? {
            id: roomRow.owner_id,
            slug: ownerProfileData.slug,
            isPublicHiddenByAdmin: ownerProfileData.is_public_hidden_by_admin,
          }
        : null,
      room: {
        ownerId: roomRow.owner_id,
        propertyId: roomRow.property_id,
        kind: roomRow.room_kind,
        isActive: roomRow.is_active,
        capacity: roomRow.capacity,
        bedrooms: roomRow.bedrooms,
      },
      property: propertyRow
        ? {
            id: propertyRow.id,
            ownerId: propertyRow.owner_id,
            slug: propertyRow.slug,
            published: propertyRow.published,
            isFrozen: propertyRow.is_frozen,
          }
        : null,
    });

    if (contextFailure) {
      return { ok: false, reason: contextFailure };
    }
  } else if (ownerProfileData?.is_public_hidden_by_admin) {
    return { ok: false, reason: "property_not_found" as const };
  }

  const ownerSubscription = await getSubscriptionRuntimeState(roomRow.owner_id, "owner");
  let sourceContextAllowed: boolean | undefined;
  let canonicalAgentMarkupPercent = 0;

  if (source === "agent") {
    if (!input.agentProfileId) {
      return { ok: false, reason: "validation_failed" as const };
    }

    const [agentProfileResult, agentRoleResult, propertyLinkResult, roomLinkResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, agent_public_id, is_public_hidden_by_admin")
        .eq("id", input.agentProfileId)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("profile_id")
        .eq("profile_id", input.agentProfileId)
        .eq("role", "agent")
        .maybeSingle(),
      roomRow.property_id
        ? supabase
            .from("agent_property_links")
            .select("id")
            .eq("agent_id", input.agentProfileId)
            .eq("property_id", roomRow.property_id)
            .eq("status", "active")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      roomRow.room_kind === "standalone_room"
        ? supabase
            .from("agent_room_links")
            .select("id")
            .eq("agent_id", input.agentProfileId)
            .eq("room_id", roomRow.id)
            .eq("status", "active")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    for (const result of [agentProfileResult, agentRoleResult, propertyLinkResult, roomLinkResult]) {
      if (result.error) {
        throw result.error;
      }
    }

    const agentContextFailure = getAgentPublicRequestContextFailure({
      requestedPublicId: input.publicSlug,
      agent: agentProfileResult.data
        ? {
            id: agentProfileResult.data.id,
            publicId: agentProfileResult.data.agent_public_id,
            hasAgentRole: Boolean(agentRoleResult.data),
            isPublicHiddenByAdmin: agentProfileResult.data.is_public_hidden_by_admin,
          }
        : null,
      room: {
        ownerId: roomRow.owner_id,
        propertyId: roomRow.property_id,
        kind: roomRow.room_kind,
      },
      hasActivePropertyLink: Boolean(propertyLinkResult.data),
      hasActiveRoomLink: Boolean(roomLinkResult.data),
    });

    if (agentContextFailure) {
      return { ok: false, reason: "property_not_found" as const };
    }

    const agentSubscription = await getSubscriptionRuntimeState(input.agentProfileId, "agent");
    sourceContextAllowed = agentSubscription.isRequestIntakeAllowed;
  }

  if (source === "collection") {
    if (!input.collectionId) {
      return { ok: false, reason: "validation_failed" as const };
    }

    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("creator_id, creator_role, slug, is_archived")
      .eq("id", input.collectionId)
      .maybeSingle();

    if (collectionError) {
      throw collectionError;
    }

    if (!collectionData || (collectionData.creator_role !== "owner" && collectionData.creator_role !== "agent")) {
      return { ok: false, reason: "property_not_found" as const };
    }

    const [collectionItemsResult, creatorProfileResult, creatorRoleResult, propertyLinkResult, roomLinkResult] = await Promise.all([
      supabase
        .from("collection_items")
        .select("property_id, room_id")
        .eq("collection_id", input.collectionId),
      supabase
        .from("profiles")
        .select("is_public_hidden_by_admin")
        .eq("id", collectionData.creator_id)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("profile_id")
        .eq("profile_id", collectionData.creator_id)
        .eq("role", collectionData.creator_role)
        .maybeSingle(),
      collectionData.creator_role === "agent" && roomRow.property_id && collectionData.creator_id !== roomRow.owner_id
        ? supabase
            .from("agent_property_links")
            .select("id")
            .eq("agent_id", collectionData.creator_id)
            .eq("property_id", roomRow.property_id)
            .eq("status", "active")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      collectionData.creator_role === "agent" && roomRow.room_kind === "standalone_room" && collectionData.creator_id !== roomRow.owner_id
        ? supabase
            .from("agent_room_links")
            .select("id")
            .eq("agent_id", collectionData.creator_id)
            .eq("room_id", roomRow.id)
            .eq("status", "active")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    for (const result of [collectionItemsResult, creatorProfileResult, creatorRoleResult, propertyLinkResult, roomLinkResult]) {
      if (result.error) {
        throw result.error;
      }
    }

    const contextFailure = getCollectionRequestContextFailure({
      publicSlug: input.publicSlug,
      agentProfileId: input.agentProfileId,
      collection: {
        creatorId: collectionData.creator_id,
        creatorRole: collectionData.creator_role,
        slug: collectionData.slug,
        isArchived: collectionData.is_archived,
        creatorHasRole: Boolean(creatorRoleResult.data),
        isCreatorHidden: Boolean(creatorProfileResult.data?.is_public_hidden_by_admin),
      },
      room: {
        ownerId: roomRow.owner_id,
        propertyId: roomRow.property_id,
        kind: roomRow.room_kind,
      },
      isRoomIncluded: isRoomIncludedInCollection(
        (collectionItemsResult.data ?? []).map((item) => ({
          propertyId: item.property_id,
          roomId: item.room_id,
        })),
        { id: roomRow.id, propertyId: roomRow.property_id },
      ),
      hasActivePropertyLink: Boolean(propertyLinkResult.data),
      hasActiveRoomLink: Boolean(roomLinkResult.data),
    });

    if (contextFailure) {
      return { ok: false, reason: contextFailure };
    }

    const creatorSubscription = await getSubscriptionRuntimeState(
      collectionData.creator_id,
      collectionData.creator_role,
    );
    sourceContextAllowed = creatorSubscription.isRequestIntakeAllowed;
  }

  if (
    !isGuestRequestSubscriptionAllowed({
      source,
      ownerAllowed: ownerSubscription.isRequestIntakeAllowed,
      sourceContextAllowed,
    })
  ) {
    return { ok: false, reason: "subscription_expired" as const };
  }

  if (source !== "owner" && (roomRow.capacity < filters.adults || roomRow.bedrooms < filters.rooms)) {
    return { ok: false, reason: "room_not_suitable" as const };
  }

  const hasAgentPricing = source === "agent" || (source === "collection" && Boolean(input.agentProfileId));

  if (hasAgentPricing && input.agentProfileId) {
    const { data: markupData, error: markupError } = await supabase
      .from("room_agent_markups")
      .select("markup_percent")
      .eq("room_id", roomRow.id)
      .eq("agent_id", input.agentProfileId)
      .maybeSingle();

    if (markupError) {
      throw markupError;
    }

    canonicalAgentMarkupPercent = Math.max(Number(markupData?.markup_percent ?? 0), 0);
  }

  const [seasonalResult, busyResult] = await Promise.all([
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

  if (seasonalResult.error) {
    throw seasonalResult.error;
  }

  if (busyResult.error) {
    throw busyResult.error;
  }

  const seasonalRows = seasonalResult.data;
  const busyRows = busyResult.data;

  const seasonalPrices = (seasonalRows ?? []).map(mapSeasonalPrice);
  const busyRanges = (busyRows ?? []).map(mapBusyRange);

  if (!isRoomAvailableForDates({ busyRanges }, filters.checkIn, filters.checkOut)) {
    return { ok: false, reason: "availability_failed" as const };
  }

  const basePricePerNight = Number(roomRow.price_per_night);
  const markupPercent = canonicalAgentMarkupPercent;
  const pricing = calculateRoomPricing(
    {
      id: roomRow.id,
      pricePerNight: basePricePerNight,
      capacity: roomRow.capacity,
      bedrooms: roomRow.bedrooms,
      seasonalPrices,
      busyRanges,
      agentMarkupPercent: hasAgentPricing ? markupPercent : 0,
    },
    filters.checkIn,
    filters.checkOut,
  );

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
    total_price: pricing.totalPrice,
    pricing_snapshot: {
      source,
      room_id: roomRow.id,
      property_id: propertyRow?.id ?? null,
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      adults_count: filters.adults,
      rooms_count: filters.rooms,
      nights: pricing.nights,
      base_price_per_night: basePricePerNight,
      display_price_per_night: pricing.displayPricePerNight,
      total_price: pricing.totalPrice,
      nightly_prices: pricing.nightlyPrices,
      agent_markup_percent: hasAgentPricing ? markupPercent : null,
    },
  }).select("id").single();

  if (error) {
    logServerDataError("guest_request_insert_failed", error, { source });
    return { ok: false, reason: "save_failed" as const };
  }

  if (!insertedRequest?.id) {
    logServerDataError("guest_request_insert_missing_id", new Error("Missing inserted request identifier."), { source });
    return { ok: false, reason: "save_failed" as const };
  }

  const recipientId = hasAgentPricing ? input.agentProfileId ?? null : roomRow.owner_id;

  if (recipientId) {
    try {
      const notificationResult = await createNotificationEvent({
        recipientId,
        eventType: "new_request",
        idempotencyKey: buildNotificationIdempotencyKey({
          eventType: "new_request",
          sourceId: insertedRequest.id,
        }),
        payload: {
          requestId: insertedRequest.id,
          propertyId: propertyRow?.id ?? undefined,
          propertyTitle: propertyRow?.title ?? roomRow.title,
          roomTitle: roomRow.title,
          roleContext: hasAgentPricing ? "agent" : "owner",
        },
      });

      if (!notificationResult.ok) {
        logServerDataError("guest_request_notification_save_failed", new Error("Notification was not saved."), { source });
      }
    } catch (error) {
      logServerDataError("guest_request_notification_unhandled_error", error, { source });
    }
  }

  return { ok: true, mode: "supabase" as const };
}

export async function transitionOwnerRequestStatus(input: {
  requestId: string;
  nextStatus: Extract<RequestStatus, "accepted_by_owner" | "rejected" | "completed">;
}) {
  if (!canUseSupabase()) {
    logServerConfigurationError("owner_request_transition_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("guest_requests").select("*").eq("id", input.requestId).maybeSingle();
  const request = data;

  if (!request || !canManageOwnedResource(profile, request.owner_id)) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const allowed = canOwnerTransitionRequestStatus(request, input.nextStatus);

  if (!allowed) {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const payload: TablesUpdate<"guest_requests"> = {
    status: input.nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (input.nextStatus === "accepted_by_owner") {
    payload.owner_confirmed_at = new Date().toISOString();
  }

  if (input.nextStatus === "completed") {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("guest_requests").update(payload).eq("id", input.requestId)
    .eq("owner_id", profile.id);

  if (error) {
    logServerDataError("owner_request_transition_save_failed", error);
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function transferAgentRequestToOwner(input: { requestId: string }) {
  if (!canUseSupabase()) {
    logServerConfigurationError("agent_request_transfer_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("guest_requests").select("*").eq("id", input.requestId).maybeSingle();
  const request = data;

  if (
    !request ||
    !canAgentManageRequest(profile, request.agent_id) ||
    (request.source !== "agent" && request.source !== "collection")
  ) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (!canAgentTransferRequest(request)) {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const { error } = await supabase
    .from("guest_requests")
    .update({
      status: "transferred_to_owner",
      transferred_to_owner_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("agent_id", profile.id);

  if (error) {
    logServerDataError("agent_request_transfer_save_failed", error);
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
    idempotencyKey: buildNotificationIdempotencyKey({
      eventType: "request_transferred_to_owner",
      sourceId: request.id,
    }),
    payload: {
      requestId: request.id,
      propertyId: request.property_id ?? undefined,
      propertyTitle: propertyData?.title ?? undefined,
      roomTitle: roomData?.title ?? undefined,
      roleContext: "owner",
    },
  });

  return { ok: true as const };
}

export async function requestAgentCompletion(input: { requestId: string }) {
  if (!canUseSupabase()) {
    logServerConfigurationError("agent_request_completion_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("guest_requests").select("*").eq("id", input.requestId).maybeSingle();
  const request = data;

  if (!request || !canAgentManageRequest(profile, request.agent_id) || (request.source !== "agent" && request.source !== "collection")) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (!canAgentRequestCompletion(request)) {
    return { ok: false as const, reason: "invalid_transition" as const };
  }

  const requestedAt = new Date().toISOString();
  const { error } = await supabase
    .from("guest_requests")
    .update({
      completion_requested_at: requestedAt,
      updated_at: requestedAt,
    })
    .eq("id", input.requestId)
    .eq("agent_id", profile.id);

  if (error) {
    logServerDataError("agent_request_completion_save_failed", error);
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
    idempotencyKey: buildNotificationIdempotencyKey({
      eventType: "request_completion_requested",
      sourceId: request.id,
    }),
    payload: {
      requestId: request.id,
      propertyId: request.property_id ?? undefined,
      propertyTitle: propertyData?.title ?? undefined,
      roomTitle: roomData?.title ?? undefined,
      roleContext: "owner",
    },
  });

  return { ok: true as const };
}
