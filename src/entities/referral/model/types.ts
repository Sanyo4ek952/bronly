import type { SubscriptionRoleContext } from "@/entities/subscription";

export type ReferralInviteRole = "owner" | "agent";
export type ReferralInviteIntent = "join_app" | "collaboration";
export type ReferralInviteStatus = "active" | "used" | "revoked" | "expired";
export type ReferralMilestoneType = "owner_inventory_created" | "agent_first_active_collaboration";
export type ReferralApprovalStatus = "pending" | "approved" | "rejected";

export type ReferralInviteSummary = {
  id: string;
  token: string;
  inviterProfileId: string;
  inviterName: string;
  inviterRole: ReferralInviteRole;
  inviteeRole: ReferralInviteRole;
  intent: ReferralInviteIntent;
  status: ReferralInviteStatus;
  usedByProfileId: string | null;
  usedAt: string | null;
  createdAt: string;
  inviteUrl: string;
  title: string;
  description: string;
  nextStepText: string;
  shareMessage: string;
};

export type ReferralInvitePageData = {
  invite: ReferralInviteSummary | null;
  canRegister: boolean;
  targetHref: string;
  targetLabel: string;
};

export type ReferralQueueItem = {
  rewardId: string;
  inviterProfileId: string;
  inviterName: string;
  invitedProfileId: string;
  invitedName: string;
  inviterRoles: SubscriptionRoleContext[];
  milestoneType: ReferralMilestoneType;
  milestoneLabel: string;
  milestoneReachedAt: string;
  rewardDays: number;
  inviteToken: string;
};
