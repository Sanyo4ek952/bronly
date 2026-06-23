import type { OwnerRequestItem } from "@/entities/request/model/types";
import type { SupabaseGuestRequestRow } from "@/shared/api/supabase/types";

export type RequestStatus = OwnerRequestItem["status"];
export type RequestSource = OwnerRequestItem["source"];

export function getSnapshotNumber(snapshot: Record<string, unknown>, key: string) {
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

export function getSnapshotRoomsCount(snapshot: Record<string, unknown>) {
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
