import type {
  AgentDashboardSummary,
  AgentLinkStatus,
  AgentCollaborationTargetType,
  CollaborationContact,
  CollaborationTargetSummary,
} from "@/entities/collaboration/model/types";
import type { AuthProfile } from "@/shared/api/supabase/server-auth";
import { buildAgentPublicPath } from "@/shared/lib/public-links";

import type { ProfileContactRow, RoomLookupRow } from "./collaboration-types";

export function getFallbackSummary(profile: AuthProfile): AgentDashboardSummary {
  const publicLinkHref = buildAgentPublicPath(profile.agentPublicId);

  return {
    activeCollaborations: 0,
    incomingRequests: 0,
    completedDeals: 0,
    publicLinkLabel: publicLinkHref ?? "",
    publicLinkHref,
  };
}

export function getStatusLabel(status: AgentLinkStatus) {
  switch (status) {
    case "active":
      return "Активно";
    case "pending":
      return "Ожидает";
    case "declined":
      return "Отклонено";
    default:
      return "Завершено";
  }
}

export function getContact(input?: ProfileContactRow | null): CollaborationContact {
  return {
    phone: input?.phone ?? "",
    whatsapp: input?.whatsapp ?? "",
    telegram: input?.telegram ?? "",
  };
}

export function getCollaborationTerms(terms: string | null, message: string | null) {
  return terms ?? message ?? "Сообщение не добавлено";
}

export function buildCollaborationTarget(
  id: string,
  targetType: AgentCollaborationTargetType,
  targetTitle: string,
): CollaborationTargetSummary {
  return {
    id,
    targetType,
    targetTitle,
  };
}

export function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function normalizeMarkupPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

export function mapStandaloneRoomLocation(room: RoomLookupRow) {
  return [room.property_type ?? "Отдельный номер", room.city ?? "", room.address ?? ""].filter(Boolean).join(" • ");
}
