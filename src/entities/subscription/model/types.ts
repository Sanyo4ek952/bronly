export type SubscriptionRoleContext = "owner" | "agent";

export type SubscriptionStatus = "trial" | "active" | "grace" | "expired";

export type PublicRestrictionMode = "none" | "grace" | "expired";

export type SubscriptionRuntimeState = {
  profileId: string;
  roleContext: SubscriptionRoleContext;
  status: SubscriptionStatus;
  statusLabel: string;
  planName: string;
  activeRoomCount: number;
  roomLimit: number;
  roomLimitOverride: number | null;
  remainingRoomSlots: number;
  isRoomLimitReached: boolean;
  canAddActiveRoom: boolean;
  validUntil: string | null;
  paidUntil: string | null;
  graceEndsAt: string | null;
  trialEndsAt: string | null;
  hasSubscriptionRow: boolean;
  isCabinetAllowed: boolean;
  isPublicRestricted: boolean;
  isPublicAllowed: boolean;
  isRequestIntakeAllowed: boolean;
  showGraceWarning: boolean;
  publicRestrictionMode: PublicRestrictionMode;
  publicWarningText: string | null;
};
