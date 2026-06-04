import type { SubscriptionRoleContext, SubscriptionStatus } from "@/entities/subscription";

export type AdminUserItem = {
  profileId: string;
  displayName: string;
  slug: string;
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
};
