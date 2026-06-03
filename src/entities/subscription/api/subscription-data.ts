import { cache } from "react";

import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase";
import type { SupabaseSubscriptionRow } from "@/shared/api/supabase";

import type {
  PublicRestrictionMode,
  SubscriptionPlanTier,
  SubscriptionRoleContext,
  SubscriptionRuntimeState,
  SubscriptionStatus,
} from "@/entities/subscription/model/types";

const PUBLIC_GRACE_WARNING =
  "Владелец страницы еще не продлил доступ к сервису. Информация может быть временно недоступна после окончания периода продления.";

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

function toValidUntil(subscriptionRow: SupabaseSubscriptionRow | null) {
  if (!subscriptionRow) {
    return null;
  }

  return subscriptionRow.paid_until ?? subscriptionRow.grace_ends_at ?? subscriptionRow.trial_ends_at ?? null;
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

async function countOwnerActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data: propertyRows } = await admin
    .from("properties")
    .select("id")
    .eq("owner_id", profileId)
    .eq("is_frozen", false);

  const propertyIds = (propertyRows ?? []).map((row) => row.id as string);

  if (!propertyIds.length) {
    return 0;
  }

  const { count } = await admin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .in("property_id", propertyIds)
    .eq("is_active", true);

  return count ?? 0;
}

async function countAgentActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data: linkRows } = await admin
    .from("agent_property_links")
    .select("property_id")
    .eq("agent_id", profileId)
    .eq("status", "active");

  const propertyIds = (linkRows ?? []).map((row) => row.property_id as string);

  if (!propertyIds.length) {
    return 0;
  }

  const { data: visiblePropertyRows } = await admin
    .from("properties")
    .select("id")
    .in("id", propertyIds)
    .eq("published", true)
    .eq("is_frozen", false);

  const visiblePropertyIds = (visiblePropertyRows ?? []).map((row) => row.id as string);

  if (!visiblePropertyIds.length) {
    return 0;
  }

  const { count } = await admin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .in("property_id", visiblePropertyIds)
    .eq("is_active", true);

  return count ?? 0;
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

export const getSubscriptionRuntimeState = cache(
  async (profileId: string, roleContext: SubscriptionRoleContext): Promise<SubscriptionRuntimeState> => {
    const [subscriptionRow, activeRoomCount] = await Promise.all([
      getSubscriptionRow(profileId, roleContext),
      countActiveRooms(profileId, roleContext),
    ]);

    const derivedPlan = resolveDerivedPlan(activeRoomCount);
    const status = subscriptionRow?.status ?? "trial";
    const validUntil = toValidUntil(subscriptionRow);
    const roomLimit = subscriptionRow?.active_room_limit ?? derivedPlan.roomLimit;
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
      statusLabel: formatStatusLabel(status),
      planTier,
      planName,
      activeRoomCount,
      roomLimit,
      validUntil,
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
