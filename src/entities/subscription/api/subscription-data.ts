import { cache } from "react";

import { calculateSubscriptionRuntimeState } from "../model/subscription-rules";
export { buildSubscriptionSchedule, getDefaultGraceEndsAt, isRoomLimitReached } from "../model/subscription-rules";

import type { SubscriptionRoleContext, SubscriptionRuntimeState } from "@/entities/subscription/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase";
import type { SupabaseSubscriptionRow } from "@/shared/api/supabase";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";

async function countOwnerActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", profileId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function countAgentActiveRooms(profileId: string) {
  const admin = createSupabaseAdminClient();
  const [ownRoomResult, propertyLinkResult, roomLinkResult] = await Promise.all([
    admin.from("rooms").select("id").eq("owner_id", profileId).eq("is_active", true),
    admin
      .from("agent_property_links")
      .select("property_id")
      .eq("agent_id", profileId)
      .eq("status", "active"),
    admin.from("agent_room_links").select("room_id").eq("agent_id", profileId).eq("status", "active"),
  ]);

  for (const result of [ownRoomResult, propertyLinkResult, roomLinkResult]) {
    if (result.error) {
      throw result.error;
    }
  }

  const ownRoomRows = ownRoomResult.data;
  const propertyLinkRows = propertyLinkResult.data;
  const roomLinkRows = roomLinkResult.data;

  const activeRoomIds = new Set<string>();

  for (const row of ownRoomRows ?? []) {
    activeRoomIds.add(row.id);
  }

  const propertyIds = (propertyLinkRows ?? []).map((row) => row.property_id);

  if (propertyIds.length) {
    const { data: visiblePropertyRows, error: visiblePropertyError } = await admin
      .from("properties")
      .select("id")
      .in("id", propertyIds)
      .eq("published", true)
      .eq("is_frozen", false);

    if (visiblePropertyError) {
      throw visiblePropertyError;
    }

    const visiblePropertyIds = (visiblePropertyRows ?? []).map((row) => row.id);

    if (visiblePropertyIds.length) {
      const { data: linkedPropertyRoomRows, error: linkedPropertyRoomError } = await admin
        .from("rooms")
        .select("id")
        .in("property_id", visiblePropertyIds)
        .eq("is_active", true);

      if (linkedPropertyRoomError) {
        throw linkedPropertyRoomError;
      }

      for (const row of linkedPropertyRoomRows ?? []) {
        activeRoomIds.add(row.id);
      }
    }
  }

  const standaloneRoomIds = (roomLinkRows ?? []).map((row) => row.room_id);

  if (standaloneRoomIds.length) {
    const { data: linkedStandaloneRoomRows, error: linkedStandaloneRoomError } = await admin
      .from("rooms")
      .select("id")
      .in("id", standaloneRoomIds)
      .eq("is_active", true);

    if (linkedStandaloneRoomError) {
      throw linkedStandaloneRoomError;
    }

    for (const row of linkedStandaloneRoomRows ?? []) {
      activeRoomIds.add(row.id);
    }
  }

  return activeRoomIds.size;
}

async function countActiveRooms(profileId: string, roleContext: SubscriptionRoleContext) {
  if (roleContext === "agent") {
    return countAgentActiveRooms(profileId);
  }

  return countOwnerActiveRooms(profileId);
}

async function getSubscriptionRow(profileId: string, roleContext: SubscriptionRoleContext) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export const getSubscriptionRuntimeState = cache(
  async (profileId: string, roleContext: SubscriptionRoleContext): Promise<SubscriptionRuntimeState> => {
    if (!canUseSupabase()) {
      logServerConfigurationError("subscription_runtime_supabase_not_configured", { roleContext });
      throw new Error("Subscription data source is unavailable.");
    }

    const now = new Date();
    const [rawSubscriptionRow, activeRoomCount] = await Promise.all([
      getSubscriptionRow(profileId, roleContext),
      countActiveRooms(profileId, roleContext),
    ]);

    return calculateSubscriptionRuntimeState({
      profileId,
      roleContext,
      subscriptionRow: rawSubscriptionRow,
      activeRoomCount,
      now,
      storedStatus: rawSubscriptionRow?.status ?? "expired",
    });
  },
);

export async function getPublicPropertyWarningText(profileId: string) {
  const subscription = await getSubscriptionRuntimeState(profileId, "owner");
  return subscription.publicWarningText;
}
