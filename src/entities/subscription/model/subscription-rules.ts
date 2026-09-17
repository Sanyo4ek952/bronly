import type {
  PublicRestrictionMode,
  SubscriptionRoleContext,
  SubscriptionRuntimeState,
  SubscriptionStatus,
} from "@/entities/subscription/model/types";
import type { SupabaseSubscriptionRow } from "@/shared/api/supabase/types";

export const SUBSCRIPTION_PLAN_NAME = "Bronly";
export const SUBSCRIPTION_MONTHLY_PRICE_RUB = 490;
export const SUBSCRIPTION_YEARLY_PRICE_RUB = 4_490;
export const DEFAULT_ROOM_LIMIT = 15;
export const GRACE_PERIOD_DAYS = 3;
export const TRIAL_PERIOD_DAYS = 30;

const PUBLIC_GRACE_WARNING =
  "Подписку нужно продлить. После окончания grace period публичная страница будет скрыта, а новые заявки временно остановятся.";

function formatStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case "trial":
      return "Пробный период";
    case "active":
      return "Активна";
    case "grace":
      return "Нужно продлить";
    case "expired":
      return "Доступ ограничен";
  }
}

function addDays(base: Date, days: number) {
  const nextDate = new Date(base);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function toTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getRemainingRoomSlots(activeRoomCount: number, roomLimit: number) {
  return Math.max(roomLimit - activeRoomCount, 0);
}

function toValidUntil(
  status: SubscriptionStatus,
  row: Pick<SupabaseSubscriptionRow, "paid_until" | "grace_ends_at" | "trial_ends_at"> | null,
) {
  if (!row) {
    return null;
  }

  switch (status) {
    case "trial":
      return row.trial_ends_at;
    case "active":
      return row.paid_until;
    case "grace":
      return row.grace_ends_at;
    case "expired":
      return row.grace_ends_at ?? row.paid_until ?? row.trial_ends_at;
  }
}

function toPublicRestrictionMode(status: SubscriptionStatus): PublicRestrictionMode {
  if (status === "expired") {
    return "expired";
  }

  if (status === "grace") {
    return "grace";
  }

  return "none";
}

export function resolveEffectiveStatus(
  row: SupabaseSubscriptionRow | null,
  now: Date,
): {
  status: SubscriptionStatus;
  graceEndsAt: string | null;
} {
  if (!row) {
    return { status: "expired", graceEndsAt: null };
  }

  const nowTimestamp = now.getTime();
  const paidUntilTimestamp = toTimestamp(row.paid_until);

  if (paidUntilTimestamp != null) {
    if (paidUntilTimestamp >= nowTimestamp) {
      return {
        status: "active",
        graceEndsAt: null,
      };
    }

    const computedGraceEndsAt = row.grace_ends_at ?? addDays(new Date(paidUntilTimestamp), GRACE_PERIOD_DAYS).toISOString();
    const graceEndsAtTimestamp = toTimestamp(computedGraceEndsAt);

    return {
      status: graceEndsAtTimestamp != null && graceEndsAtTimestamp >= nowTimestamp ? "grace" : "expired",
      graceEndsAt: computedGraceEndsAt,
    };
  }

  if (row.status === "trial") {
    const trialEndsAtTimestamp = toTimestamp(row.trial_ends_at);

    if (trialEndsAtTimestamp != null && trialEndsAtTimestamp >= nowTimestamp) {
      return { status: "trial", graceEndsAt: null };
    }

    if (trialEndsAtTimestamp == null) {
      return { status: "expired", graceEndsAt: null };
    }

    const computedGraceEndsAt =
      row.grace_ends_at ?? addDays(new Date(trialEndsAtTimestamp), GRACE_PERIOD_DAYS).toISOString();
    const graceEndsAtTimestamp = toTimestamp(computedGraceEndsAt);

    return {
      status: graceEndsAtTimestamp != null && graceEndsAtTimestamp >= nowTimestamp ? "grace" : "expired",
      graceEndsAt: computedGraceEndsAt,
    };
  }

  if (row.status === "grace") {
    const graceEndsAtTimestamp = toTimestamp(row.grace_ends_at);
    return {
      status: graceEndsAtTimestamp != null && graceEndsAtTimestamp >= nowTimestamp ? "grace" : "expired",
      graceEndsAt: row.grace_ends_at,
    };
  }

  if (row.status === "active") {
    return { status: "active", graceEndsAt: null };
  }

  return { status: "expired", graceEndsAt: row.grace_ends_at };
}

export function getDefaultGraceEndsAt(baseDate: Date) {
  return addDays(baseDate, GRACE_PERIOD_DAYS).toISOString();
}

export function buildSubscriptionSchedule({
  status,
  now,
  trialEndsAt,
  graceEndsAt,
  paidUntil,
}: {
  status: SubscriptionStatus;
  now: Date;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  paidUntil: string | null;
}) {
  const nowTimestamp = now.getTime();
  const keepFutureOrAddDays = (value: string | null, days: number) => {
    const timestamp = toTimestamp(value);
    return timestamp != null && timestamp > nowTimestamp ? new Date(timestamp).toISOString() : addDays(now, days).toISOString();
  };

  switch (status) {
    case "trial": {
      const nextTrialEndsAt = keepFutureOrAddDays(trialEndsAt, TRIAL_PERIOD_DAYS);
      return {
        trialEndsAt: nextTrialEndsAt,
        paidUntil: null,
        graceEndsAt: addDays(new Date(nextTrialEndsAt), GRACE_PERIOD_DAYS).toISOString(),
      };
    }
    case "active":
      return {
        trialEndsAt,
        paidUntil: keepFutureOrAddDays(paidUntil, 30),
        graceEndsAt: null,
      };
    case "grace":
      return {
        trialEndsAt,
        paidUntil: null,
        graceEndsAt: keepFutureOrAddDays(graceEndsAt, GRACE_PERIOD_DAYS),
      };
    case "expired":
      return {
        trialEndsAt: null,
        paidUntil: null,
        graceEndsAt: null,
      };
  }
}

export function isRoomLimitReached(activeRoomCount: number, roomLimit: number) {
  return activeRoomCount >= roomLimit;
}

// Explicit time keeps the calculation independent from I/O and the system clock.
export function calculateSubscriptionRuntimeState({
  profileId,
  roleContext,
  subscriptionRow,
  activeRoomCount,
  now,
}: {
  profileId: string;
  roleContext: SubscriptionRoleContext;
  subscriptionRow: SupabaseSubscriptionRow | null;
  activeRoomCount: number;
  now: Date;
}): SubscriptionRuntimeState {
  const resolved = resolveEffectiveStatus(subscriptionRow, now);
  const status = resolved.status;
  const validUntil = toValidUntil(
    status,
    subscriptionRow
      ? {
          paid_until: subscriptionRow.paid_until,
          grace_ends_at: resolved.graceEndsAt,
          trial_ends_at: subscriptionRow.trial_ends_at,
        }
      : null,
  );
  const roomLimitOverride = subscriptionRow?.room_limit_override ?? null;
  const roomLimit = roomLimitOverride ?? DEFAULT_ROOM_LIMIT;
  const remainingRoomSlots = getRemainingRoomSlots(activeRoomCount, roomLimit);
  const roomLimitReached = isRoomLimitReached(activeRoomCount, roomLimit);
  const publicRestrictionMode = toPublicRestrictionMode(status);

  return {
    profileId,
    roleContext,
    status,
    statusLabel: formatStatusLabel(status),
    planName: SUBSCRIPTION_PLAN_NAME,
    activeRoomCount,
    roomLimit,
    roomLimitOverride,
    remainingRoomSlots,
    isRoomLimitReached: roomLimitReached,
    canAddActiveRoom: !roomLimitReached,
    validUntil,
    paidUntil: subscriptionRow?.paid_until ?? null,
    graceEndsAt: resolved.graceEndsAt,
    trialEndsAt: subscriptionRow?.trial_ends_at ?? null,
    hasSubscriptionRow: Boolean(subscriptionRow),
    isCabinetAllowed: true,
    isPublicRestricted: status === "expired",
    isPublicAllowed: status !== "expired",
    isRequestIntakeAllowed: status !== "expired",
    showGraceWarning: status === "grace",
    publicRestrictionMode,
    publicWarningText: publicRestrictionMode === "grace" ? PUBLIC_GRACE_WARNING : null,
  };
}
