import type { SubscriptionRoleContext, SubscriptionStatus } from "@/entities/subscription";
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
  roleContext: SubscriptionRoleContext;
  status: SubscriptionStatus;
  statusLabel: string;
  planName: string;
  activeRoomCount: number;
  activeRoomLimit: number | null;
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

export type AdminPropertiesPageData = {
  properties: AdminPropertyItem[];
  frozenPropertyCount: number;
};

export type AdminReviewsPageData = {
  pendingReferralRewards: ReferralQueueItem[];
};
