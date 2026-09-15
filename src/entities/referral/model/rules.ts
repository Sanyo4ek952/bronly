import type {
  ReferralApprovalStatus,
  ReferralInviteRole,
  ReferralInviteStatus,
  ReferralMilestoneType,
} from "./types";

export function isReferralInviteAvailable(input: {
  status: ReferralInviteStatus;
  usedByProfileId: string | null;
  expiresAt: string | null;
  now?: Date;
}) {
  if (input.status !== "active" || input.usedByProfileId) {
    return false;
  }

  if (!input.expiresAt) {
    return true;
  }

  const expiresAt = new Date(input.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > (input.now ?? new Date());
}

export function getMilestoneInviteeRole(milestoneType: ReferralMilestoneType): ReferralInviteRole {
  return milestoneType === "agent_first_active_collaboration" ? "agent" : "owner";
}

export function getReferralReviewResult(
  currentStatus: ReferralApprovalStatus,
  decision: Exclude<ReferralApprovalStatus, "pending">,
) {
  if (currentStatus === "pending") {
    return decision;
  }

  if (currentStatus === decision) {
    return `already_${decision}` as const;
  }

  return `conflict_${currentStatus}` as const;
}
