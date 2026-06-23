import type { AgentRequestItem, OwnerRequestItem } from "@/entities/request/model/types";
import type { SupabaseGuestRequestRow } from "@/shared/api/supabase/types";
import { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";

import {
  formatFullGuestLabel,
  getRequestRoomsCount,
  getSnapshotBasePricePerNight,
  getSnapshotPricePerNight,
  getSnapshotTotalPrice,
  normalizeSource,
  normalizeStatus,
} from "./request-rules";

export type RequestRoomMeta = {
  title: string;
  pricePerNight: number;
};

export function mapOwnerRequestItem(
  request: SupabaseGuestRequestRow,
  roomMeta: RequestRoomMeta | undefined,
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
    roomsCount: getRequestRoomsCount(request),
    comment: request.guest_comment ?? "",
    totalPrice: getSnapshotTotalPrice(request),
    quotedPricePerNight: getSnapshotPricePerNight(request),
    basePricePerNight: getSnapshotBasePricePerNight(request),
    completionRequestedAt: request.completion_requested_at,
  };
}

export function mapAgentRequestItem(
  request: SupabaseGuestRequestRow & { source: "agent" | "collection" },
  profileId: string,
  roomTitle: string | undefined,
  propertyTitle: string | undefined,
): AgentRequestItem {
  const status = normalizeStatus(request.status);

  return {
    id: request.id,
    propertyTitle: propertyTitle ?? "Отдельный номер",
    roomTitle: roomTitle ?? "Номер",
    guestName: request.guest_name,
    createdAt: formatDateTimeLabel(request.created_at),
    source: request.source,
    status,
    guestsLabel: formatFullGuestLabel(request.adults_count, request.children_count),
    roomsCount: getRequestRoomsCount(request),
    totalPrice: getSnapshotTotalPrice(request),
    quotedPricePerNight: getSnapshotPricePerNight(request),
    canTransferToOwner: status === "new" && request.owner_id !== profileId,
    canRequestCompletion:
      status === "accepted_by_owner" &&
      request.owner_id !== profileId &&
      request.completion_requested_at == null,
    completionRequestedAt: request.completion_requested_at,
  };
}
