export type SubscriptionRoleContext = "owner" | "agent";

export type SubscriptionStatus = "trial" | "active" | "grace" | "expired" | "manual";

export type SubscriptionPlanTier = "start" | "base" | "plus" | "custom";

export type PublicRestrictionMode = "none" | "grace" | "expired";

export type SubscriptionRuntimeState = {
  profileId: string;
  roleContext: SubscriptionRoleContext;
  status: SubscriptionStatus;
  storedStatus: SubscriptionStatus;
  statusLabel: string;
  planTier: SubscriptionPlanTier;
  planName: string;
  activeRoomCount: number;
  roomLimit: number | null;
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
