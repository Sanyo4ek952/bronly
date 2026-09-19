import type { SubscriptionStatus } from "@/entities/subscription";
import type { ReferralQueueItem } from "@/entities/referral";

export type AdminUserItem = {
  profileId: string;
  displayName: string;
  slug: string;
  createdAt: string;
  phone: string;
  roles: string[];
  isPublicHiddenByAdmin: boolean;
  publicPageUrls: string[];
  propertyCount: number;
  activeRoomCount: number;
  requestCount: number;
};

export type AdminSubscriptionItem = {
  profileId: string;
  displayName: string;
  slug: string;
  createdAt: string;
  roles: Array<"owner" | "agent">;
  status: SubscriptionStatus;
  statusLabel: string;
  activeRoomCount: number;
  roomLimit: number;
  roomLimitOverride: number | null;
  validUntil: string | null;
  paidUntil: string | null;
  graceEndsAt: string | null;
  hasSubscriptionRow: boolean;
};

export type AdminPropertyItem = {
  propertyId: string;
  ownerId: string;
  ownerName: string;
  ownerPublicSlug: string | null;
  title: string;
  slug: string;
  published: boolean;
  isFrozen: boolean;
  totalRoomCount: number;
  activeRoomCount: number;
};

export type AdminDashboardData = {
  userCount: number;
  ownerCount: number;
  agentCount: number;
  dualRoleCount: number;
  propertyCount: number;
  roomCount: number;
  requestCount: number;
  ownerRequestCount: number;
  agentRequestCount: number;
  transferredRequestCount: number;
  completedRequestCount: number;
  collectionCount: number;
  paidUserCount: number;
  activeSubscriptionCount: number;
  expiringSoonCount: number;
  frozenPropertyCount: number;
  users: AdminUserItem[];
  subscriptions: AdminSubscriptionItem[];
  properties: AdminPropertyItem[];
  pendingReferralRewards: ReferralQueueItem[];
};

export type AdminOverviewData = {
  userCount: number;
  ownerCount: number;
  agentCount: number;
  dualRoleCount: number;
  propertyCount: number;
  roomCount: number;
  requestCount: number;
  ownerRequestCount: number;
  agentRequestCount: number;
  transferredRequestCount: number;
  completedRequestCount: number;
  collectionCount: number;
  paidUserCount: number;
  activeSubscriptionCount: number;
  expiringSoonCount: number;
  frozenPropertyCount: number;
  hiddenProfileCount: number;
  pendingReferralCount: number;
  expiringSubscriptions: AdminSubscriptionItem[];
  frozenProperties: AdminPropertyItem[];
  hiddenUsers: AdminUserItem[];
  pendingReferralRewards: ReferralQueueItem[];
};

export type AdminUsersPageData = {
  users: AdminUserItem[];
  hiddenProfileCount: number;
};

export type AdminSubscriptionsPageData = {
  subscriptions: AdminSubscriptionItem[];
  expiringSoonCount: number;
  activeSubscriptionCount: number;
};

export type AdminSubscriptionPaymentItem = {
  id: string;
  billingPeriod: "month" | "year";
  amountKopecks: number;
  paymentMethod: "bank_transfer" | "cash" | "other";
  paidAt: string;
  externalReference: string | null;
  note: string | null;
  recordedBy: string;
};

export type AdminSubscriptionAuditItem = {
  id: string;
  eventType: "trial_started" | "payment_recorded" | "free_extension" | "room_limit_changed" | "access_ended";
  actorName: string;
  extensionDays: number | null;
  previousPaidUntil: string | null;
  nextPaidUntil: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type AdminSubscriptionDetailData = {
  subscription: AdminSubscriptionItem;
  payments: AdminSubscriptionPaymentItem[];
  auditEvents: AdminSubscriptionAuditItem[];
};

export type AdminPropertiesPageData = {
  properties: AdminPropertyItem[];
  frozenPropertyCount: number;
};

export type AdminReviewsPageData = {
  pendingReferralRewards: ReferralQueueItem[];
};
