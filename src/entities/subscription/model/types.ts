export type SubscriptionRoleContext = "owner" | "agent";

export type SubscriptionStatus = "trial" | "active" | "grace" | "expired";

export type StoredSubscriptionStatus = SubscriptionStatus | "manual";

export type SubscriptionPlanTier = "start" | "base" | "plus" | "custom";

export type PublicRestrictionMode = "none" | "grace" | "expired";

export type SubscriptionRuntimeState = {
  profileId: string;
  roleContext: SubscriptionRoleContext;
  status: SubscriptionStatus;
  storedStatus: StoredSubscriptionStatus;
  statusLabel: string;
  planTier: SubscriptionPlanTier;
  planName: string;
  activeRoomCount: number;
  roomLimit: number | null;
  remainingRoomSlots: number | null;
  isRoomLimitReached: boolean;
  canAddActiveRoom: boolean;
  validUntil: string | null;
  paidUntil: string | null;
  graceEndsAt: string | null;
  trialEndsAt: string | null;
  hasSubscriptionRow: boolean;
  isCabinetAllowed: boolean;
  isCabinetRestricted: boolean;
  isMutationAllowed: boolean;
  isPublicAllowed: boolean;
  isRequestIntakeAllowed: boolean;
  showGraceWarning: boolean;
  publicRestrictionMode: PublicRestrictionMode;
  publicWarningText: string | null;
};
