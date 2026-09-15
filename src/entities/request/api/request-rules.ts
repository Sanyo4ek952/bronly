import type { OwnerRequestItem } from "@/entities/request/model/types";
import type { Json } from "@/shared/api/supabase/database.types";
import type { SupabaseGuestRequestRow } from "@/shared/api/supabase/types";

export type RequestStatus = OwnerRequestItem["status"];
export type RequestSource = OwnerRequestItem["source"];

export type AgentPublicRequestContextFailure = "agent_not_found" | "room_not_shared";

export function getAgentPublicRequestContextFailure(context: {
  requestedPublicId?: string;
  agent: {
    id: string;
    publicId: string | null;
    hasAgentRole: boolean;
    isPublicHiddenByAdmin: boolean;
  } | null;
  room: {
    ownerId: string;
    propertyId: string | null;
    kind: string;
  };
  hasActivePropertyLink: boolean;
  hasActiveRoomLink: boolean;
}): AgentPublicRequestContextFailure | null {
  const { agent, room } = context;

  if (
    !agent ||
    !agent.hasAgentRole ||
    agent.isPublicHiddenByAdmin ||
    !agent.publicId ||
    agent.publicId !== context.requestedPublicId
  ) {
    return "agent_not_found";
  }

  if (room.ownerId === agent.id) {
    return null;
  }

  if (room.kind === "property_room" && room.propertyId && context.hasActivePropertyLink) {
    return null;
  }

  if (room.kind === "standalone_room" && !room.propertyId && context.hasActiveRoomLink) {
    return null;
  }

  return "room_not_shared";
}

export function isGuestRequestSubscriptionAllowed({
  source,
  ownerAllowed,
  sourceContextAllowed,
}: {
  source: RequestSource;
  ownerAllowed: boolean;
  sourceContextAllowed?: boolean;
}) {
  if (!ownerAllowed) {
    return false;
  }

  return source === "owner" || sourceContextAllowed === true;
}

export type OwnerPublicRequestContextFailure = "property_not_found" | "room_not_found" | "room_not_suitable";

type OwnerPublicRequestRoomContext = {
  publicSlug?: string;
  propertySlug?: string;
  adultsCount: number;
  roomsCount: number;
  owner: {
    id: string;
    slug: string | null;
    isPublicHiddenByAdmin: boolean;
  } | null;
  room: {
    ownerId: string;
    propertyId: string | null;
    kind: string;
    isActive: boolean;
    capacity: number;
    bedrooms: number;
  } | null;
  property: {
    id: string;
    ownerId: string;
    slug: string;
    published: boolean;
    isFrozen: boolean;
  } | null;
};

export function getOwnerPublicRequestContextFailure(
  context: OwnerPublicRequestRoomContext,
): OwnerPublicRequestContextFailure | null {
  const { owner, room, property } = context;

  if (!room?.isActive) {
    return "room_not_found";
  }

  if (
    !owner ||
    owner.isPublicHiddenByAdmin ||
    owner.id !== room.ownerId ||
    owner.slug !== context.publicSlug
  ) {
    return "property_not_found";
  }

  if (room.kind === "property_room") {
    if (
      !property ||
      room.propertyId !== property.id ||
      property.ownerId !== room.ownerId ||
      !property.published ||
      property.isFrozen ||
      (context.propertySlug ? context.propertySlug !== property.slug : false)
    ) {
      return "property_not_found";
    }
  } else {
    if (room.kind !== "standalone_room") {
      return "room_not_found";
    }

    if (room.propertyId || property || context.propertySlug) {
      return "property_not_found";
    }
  }

  if (room.capacity < context.adultsCount || room.bedrooms < context.roomsCount) {
    return "room_not_suitable";
  }

  return null;
}

export function getSnapshotNumber(snapshot: Json, key: string) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  const rawValue = snapshot[key];

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    const parsedValue = Number.parseFloat(rawValue);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

export function getSnapshotRoomsCount(snapshot: Json) {
  const snapshotValue = getSnapshotNumber(snapshot, "rooms_count");

  if (snapshotValue != null) {
    return Math.max(1, Math.trunc(snapshotValue));
  }

  return null;
}

export function getRequestRoomsCount(request: Pick<SupabaseGuestRequestRow, "rooms_count" | "pricing_snapshot">) {
  return request.rooms_count ?? getSnapshotRoomsCount(request.pricing_snapshot) ?? 1;
}

export function getSnapshotPricePerNight(request: Pick<SupabaseGuestRequestRow, "pricing_snapshot" | "base_price_per_night">) {
  return (
    getSnapshotNumber(request.pricing_snapshot, "display_price_per_night") ??
    getSnapshotNumber(request.pricing_snapshot, "base_price_per_night") ??
    Number(request.base_price_per_night ?? 0)
  );
}

export function getSnapshotBasePricePerNight(
  request: Pick<SupabaseGuestRequestRow, "pricing_snapshot" | "base_price_per_night">,
) {
  return getSnapshotNumber(request.pricing_snapshot, "base_price_per_night") ?? Number(request.base_price_per_night ?? 0);
}

export function getSnapshotTotalPrice(
  request: Pick<SupabaseGuestRequestRow, "pricing_snapshot" | "total_price" | "base_price_per_night">,
) {
  return getSnapshotNumber(request.pricing_snapshot, "total_price") ?? Number(request.total_price ?? request.base_price_per_night ?? 0);
}

export function formatFullGuestLabel(adultsCount: number, childrenCount: number) {
  const parts = [`${adultsCount} взр.`];

  if (childrenCount > 0) {
    parts.push(`${childrenCount} дет.`);
  }

  return parts.join(", ");
}

export function normalizeStatus(
  status: SupabaseGuestRequestRow["status"] | "owner_confirmed" | "declined" | "in_progress",
): RequestStatus {
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

export function normalizeSource(source: SupabaseGuestRequestRow["source"]): RequestSource {
  return source;
}

export function isAgentMediatedRequest(request: Pick<SupabaseGuestRequestRow, "agent_id" | "owner_id" | "source">) {
  return Boolean(request.agent_id) && request.agent_id !== request.owner_id && (request.source === "agent" || request.source === "collection");
}

export function canOwnerReject(status: RequestStatus) {
  return status === "new" || status === "transferred_to_owner" || status === "accepted_by_owner";
}

export function canOwnerComplete(status: RequestStatus) {
  return status === "accepted_by_owner";
}

export function shouldOwnerSeeRequestAsNew(
  request: Pick<SupabaseGuestRequestRow, "agent_id" | "owner_id" | "source" | "status">,
) {
  return normalizeStatus(request.status) === "new" && !isAgentMediatedRequest(request);
}

export function canOwnerTransitionRequestStatus(
  request: Pick<SupabaseGuestRequestRow, "agent_id" | "owner_id" | "source" | "status">,
  nextStatus: RequestStatus,
): boolean {
  const currentStatus = normalizeStatus(request.status);
  const isTransferredAgentRequest =
    (request.source === "agent" || (request.source === "collection" && isAgentMediatedRequest(request))) &&
    currentStatus === "transferred_to_owner";
  const isOwnerDirectRequest =
    (request.source === "owner" || (request.source === "collection" && !isAgentMediatedRequest(request))) &&
    currentStatus === "new";
  return (
    (nextStatus === "accepted_by_owner" && (isOwnerDirectRequest || isTransferredAgentRequest)) ||
    (nextStatus === "rejected" &&
      (((request.source === "owner" || (request.source === "collection" && !isAgentMediatedRequest(request))) &&
        canOwnerReject(currentStatus)) ||
        ((request.source === "agent" || (request.source === "collection" && isAgentMediatedRequest(request))) &&
          (currentStatus === "transferred_to_owner" || currentStatus === "accepted_by_owner")))) ||
    (nextStatus === "completed" && canOwnerComplete(currentStatus))
  );

}

export function canAgentTransferRequest(
  request: Pick<SupabaseGuestRequestRow, "source" | "status">,
) {
  return (request.source === "agent" || request.source === "collection") && normalizeStatus(request.status) === "new";
}

export function canAgentRequestCompletion(
  request: Pick<SupabaseGuestRequestRow, "source" | "status" | "completion_requested_at">,
) {
  return (
    (request.source === "agent" || request.source === "collection") &&
    normalizeStatus(request.status) === "accepted_by_owner" &&
    request.completion_requested_at == null
  );
}
