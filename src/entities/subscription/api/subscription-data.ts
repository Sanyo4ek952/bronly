import { cache } from "react";

import { createNotificationEvent } from "@/entities/notification";
import type {
  PublicRestrictionMode,
  SubscriptionPlanTier,
  SubscriptionRoleContext,
  SubscriptionRuntimeState,
  SubscriptionStatus,
} from "@/entities/subscription/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase";
import type { SupabaseSubscriptionRow } from "@/shared/api/supabase";

const GRACE_PERIOD_DAYS = 3;

const PUBLIC_GRACE_WARNING =
  "Подписка скоро будет ограничена. После окончания grace period публичная страница может скрыться, а новые заявки временно остановятся.";

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
    case "manual":
      return "Продлена вручную";
  }
}

function resolveDerivedPlan(activeRoomCount: number): {
  planTier: SubscriptionPlanTier;
  planName: string;
  roomLimit: number | null;
} {
  if (activeRoomCount <= 3) {
    return {
      planTier: "start",
      planName: "Старт",
      roomLimit: 3,
    };
  }

  if (activeRoomCount <= 10) {
    return {
      planTier: "base",
      planName: "База",
      roomLimit: 10,
    };
  }

  return {
    planTier: "plus",
    planName: "Плюс",
    roomLimit: null,
  };
}

function addDays(base: Date, days: number) {
  const nextDate = new Date(base);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getRemainingRoomSlots(activeRoomCount: number, roomLimit: number | null) {
  if (roomLimit == null) {
    return null;
  }

  return Math.max(roomLimit - activeRoomCount, 0);
}

function toValidUntil(row: Pick<SupabaseSubscriptionRow, "paid_until" | "grace_ends_at" | "trial_ends_at"> | null) {
  if (!row) {
    return null;
  }

  return row.paid_until ?? row.grace_ends_at ?? row.trial_ends_at ?? null;
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

function getSubscriptionLinkPath(roleContext: SubscriptionRoleContext) {
  return roleContext === "agent" ? "/agent/dashboard/subscription" : "/dashboard/subscription";
}

function resolveEffectiveStatus(
  row: SupabaseSubscriptionRow | null,
  now: Date,
): {
  status: SubscriptionStatus;
  graceEndsAt: string | null;
} {
  if (!row) {
    return { status: "trial", graceEndsAt: null };
  }

  if (row.status === "manual") {
    return {
      status: "manual",
      graceEndsAt: row.grace_ends_at,
    };
  }

  if (row.paid_until) {
    const paidUntil = new Date(row.paid_until);

    if (paidUntil.getTime() >= now.getTime()) {
      return {
        status: "active",
        graceEndsAt: null,
      };
    }

    const computedGraceEndsAt = row.grace_ends_at ?? addDays(paidUntil, GRACE_PERIOD_DAYS).toISOString();
    const graceEndsAtDate = new Date(computedGraceEndsAt);

    return {
      status: graceEndsAtDate.getTime() >= now.getTime() ? "grace" : "expired",
      graceEndsAt: computedGraceEndsAt,
    };
  }

  if (row.status === "grace" && row.grace_ends_at) {
    const graceEndsAt = new Date(row.grace_ends_at);

    return {
      status: graceEndsAt.getTime() >= now.getTime() ? "grace" : "expired",
      graceEndsAt: row.grace_ends_at,
    };
  }

  return {
    status: row.status,
    graceEndsAt: row.grace_ends_at,
  };
}

async function maybeSyncRuntimeSubscriptionState(
  row: SupabaseSubscriptionRow | null,
  roleContext: SubscriptionRoleContext,
  now: Date,
) {
  if (!row) {
    return null;
  }

  const resolved = resolveEffectiveStatus(row, now);
  const shouldSyncStatus = row.status !== resolved.status;
  const shouldSyncGraceEndsAt = row.grace_ends_at !== resolved.graceEndsAt;

  if (!shouldSyncStatus && !shouldSyncGraceEndsAt) {
    return row;
  }

  const admin = createSupabaseAdminClient();
  const updates: Partial<SupabaseSubscriptionRow> = {
    updated_at: now.toISOString(),
  };

  if (shouldSyncStatus) {
    updates.status = resolved.status;
  }

  if (shouldSyncGraceEndsAt) {
    updates.grace_ends_at = resolved.graceEndsAt;
  }

  const { data, error } = await admin
    .from("subscriptions")
    .update(updates)
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) {
    return {
      ...row,
      status: shouldSyncStatus ? resolved.status : row.status,
      grace_ends_at: shouldSyncGraceEndsAt ? resolved.graceEndsAt : row.grace_ends_at,
    };
  }

  if (shouldSyncStatus) {
    await createNotificationEvent({
      recipientId: row.profile_id,
      eventType: "subscription_status_changed",
      payload: {
        subscriptionStatus: resolved.status,
        roleContext,
        linkPath: getSubscriptionLinkPath(roleContext),
      },
    });

    if (resolved.status === "grace") {
      await createNotificationEvent({
        recipientId: row.profile_id,
        eventType: "subscription_reminder",
        payload: {
          subscriptionStatus: "grace",
          roleContext,
          linkPath: getSubscriptionLinkPath(roleContext),
        },
      });
    }
  }

  return (data as SupabaseSubscriptionRow | null) ?? row;
}

async function countOwnerActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", profileId)
    .eq("is_active", true);

  return count ?? 0;
}

async function countAgentActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const [{ data: ownRoomRows }, { data: propertyLinkRows }, { data: roomLinkRows }] = await Promise.all([
    admin.from("rooms").select("id").eq("owner_id", profileId).eq("is_active", true),
    admin
      .from("agent_property_links")
      .select("property_id")
      .eq("agent_id", profileId)
      .eq("status", "active"),
    admin.from("agent_room_links").select("room_id").eq("agent_id", profileId).eq("status", "active"),
  ]);

  const activeRoomIds = new Set<string>();

  for (const row of ownRoomRows ?? []) {
    activeRoomIds.add(row.id as string);
  }

  const propertyIds = (propertyLinkRows ?? []).map((row) => row.property_id as string);

  if (propertyIds.length) {
    const { data: visiblePropertyRows } = await admin
      .from("properties")
      .select("id")
      .in("id", propertyIds)
      .eq("published", true)
      .eq("is_frozen", false);

    const visiblePropertyIds = (visiblePropertyRows ?? []).map((row) => row.id as string);

    if (visiblePropertyIds.length) {
      const { data: linkedPropertyRoomRows } = await admin
        .from("rooms")
        .select("id")
        .in("property_id", visiblePropertyIds)
        .eq("is_active", true);

      for (const row of linkedPropertyRoomRows ?? []) {
        activeRoomIds.add(row.id as string);
      }
    }
  }

  const standaloneRoomIds = (roomLinkRows ?? []).map((row) => row.room_id as string);

  if (standaloneRoomIds.length) {
    const { data: linkedStandaloneRoomRows } = await admin
      .from("rooms")
      .select("id")
      .in("id", standaloneRoomIds)
      .eq("is_active", true);

    for (const row of linkedStandaloneRoomRows ?? []) {
      activeRoomIds.add(row.id as string);
    }
  }

  return activeRoomIds.size;
}

async function countActiveRooms(profileId: string, roleContext: SubscriptionRoleContext) {
  if (!canUseSupabase()) {
    return 0;
  }

  if (roleContext === "agent") {
    return countAgentActiveRooms(profileId);
  }

  return countOwnerActiveRooms(profileId);
}

async function getSubscriptionRow(profileId: string, roleContext: SubscriptionRoleContext) {
  if (!canUseSupabase()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  return (data as SupabaseSubscriptionRow | null) ?? null;
}

export function getDefaultGraceEndsAt(baseDate: Date) {
  return addDays(baseDate, GRACE_PERIOD_DAYS).toISOString();
}

export function isRoomLimitReached(activeRoomCount: number, roomLimit: number | null) {
  if (roomLimit == null) {
    return false;
  }

  return activeRoomCount >= roomLimit;
}

export const getSubscriptionRuntimeState = cache(
  async (profileId: string, roleContext: SubscriptionRoleContext): Promise<SubscriptionRuntimeState> => {
    const now = new Date();
    const [rawSubscriptionRow, activeRoomCount] = await Promise.all([
      getSubscriptionRow(profileId, roleContext),
      countActiveRooms(profileId, roleContext),
    ]);

    const subscriptionRow = await maybeSyncRuntimeSubscriptionState(rawSubscriptionRow, roleContext, now);
    const resolved = resolveEffectiveStatus(subscriptionRow, now);
    const derivedPlan = resolveDerivedPlan(activeRoomCount);
    const status = resolved.status;
    const validUntil = toValidUntil(
      subscriptionRow
        ? {
            paid_until: subscriptionRow.paid_until,
            grace_ends_at: resolved.graceEndsAt,
            trial_ends_at: subscriptionRow.trial_ends_at,
          }
        : null,
    );
    const roomLimit = subscriptionRow?.active_room_limit ?? derivedPlan.roomLimit;
    const remainingRoomSlots = getRemainingRoomSlots(activeRoomCount, roomLimit);
    const roomLimitReached = isRoomLimitReached(activeRoomCount, roomLimit);
    const planTier = subscriptionRow?.active_room_limit != null ? "custom" : derivedPlan.planTier;
    const planName =
      subscriptionRow?.plan_name && subscriptionRow.plan_name !== "MVP"
        ? subscriptionRow.plan_name
        : derivedPlan.planName;
    const publicRestrictionMode = toPublicRestrictionMode(status);

    return {
      profileId,
      roleContext,
      status,
      storedStatus: rawSubscriptionRow?.status ?? "trial",
      statusLabel: formatStatusLabel(status),
      planTier,
      planName,
      activeRoomCount,
      roomLimit,
      remainingRoomSlots,
      isRoomLimitReached: roomLimitReached,
      canAddActiveRoom: !roomLimitReached,
      validUntil,
      paidUntil: subscriptionRow?.paid_until ?? null,
      graceEndsAt: resolved.graceEndsAt,
      trialEndsAt: subscriptionRow?.trial_ends_at ?? null,
      hasSubscriptionRow: Boolean(subscriptionRow),
      isCabinetAllowed: true,
      isCabinetRestricted: status === "expired",
      isMutationAllowed: status !== "expired",
      isPublicAllowed: status !== "expired",
      isRequestIntakeAllowed: status !== "expired",
      showGraceWarning: status === "grace",
      publicRestrictionMode,
      publicWarningText: publicRestrictionMode === "grace" ? PUBLIC_GRACE_WARNING : null,
    };
  },
);

export async function getPublicPropertyWarningText(profileId: string) {
  const subscription = await getSubscriptionRuntimeState(profileId, "owner");
  return subscription.publicWarningText;
}
