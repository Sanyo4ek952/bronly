import { cache } from "react";

import { dashboardStats } from "@/entities/property/model/dashboard";
import type { OwnerDashboardSummary } from "@/entities/property/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { buildOwnerPublicPath } from "@/shared/lib";
import { formatDateLabel } from "@/shared/lib/date";

function shouldOwnerSeeRequestAsNew(request: {
  owner_id: string;
  agent_id: string | null;
  source: "owner" | "agent" | "collection";
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
}) {
  return !request.agent_id || request.agent_id === request.owner_id || request.source === "owner";
}

function getSubscriptionWarningText(input: { status: string; graceEndsAt: string | null }) {
  if (input.status === "grace") {
    return input.graceEndsAt
      ? `Подписку нужно продлить до ${formatDateLabel(input.graceEndsAt)}. До этой даты публичные страницы и новые заявки еще доступны.`
      : "Подписку нужно продлить. Пока grace period не закончился, публичные страницы и новые заявки еще доступны.";
  }

  if (input.status === "expired") {
    return "Публичные страницы и новые заявки временно ограничены до ручного продления подписки. Кабинет доступен для просмотра, но изменения данных остановлены.";
  }

  return null;
}

export const getOwnerDashboardSummary = cache(async (): Promise<OwnerDashboardSummary> => {
  if (!canUseSupabase()) {
    return dashboardStats;
  }

  try {
    const profile = await getCurrentAuthProfile();

    if (!profile) {
      return dashboardStats;
    }

    const supabase = await createSupabaseServerClient();
    const { data: propertyRows } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

    if (!(propertyRows ?? []).length) {
      return {
        objects: 0,
        rooms: 0,
        activeRooms: 0,
        newRequests: 0,
        publicUrl: buildOwnerPublicPath(profile.slug),
        subscriptionStatus: subscription.status,
        subscriptionStatusLabel: subscription.statusLabel,
        subscriptionPlan: subscription.planName,
        subscriptionValidUntil: subscription.validUntil
          ? formatDateLabel(subscription.validUntil)
          : dashboardStats.subscriptionValidUntil,
        subscriptionWarningText: getSubscriptionWarningText(subscription),
        isCabinetRestricted: subscription.isCabinetRestricted,
        isMutationAllowed: subscription.isMutationAllowed,
      };
    }

    const [{ count: objectCount }, { data: roomRows }, { data: newRequestRows }] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", profile.id),
      supabase.from("rooms").select("id, is_active").in(
        "property_id",
        (propertyRows ?? []).map((row) => row.id),
      ),
      supabase
        .from("guest_requests")
        .select("owner_id, agent_id, source, status")
        .eq("owner_id", profile.id)
        .eq("status", "new"),
    ]);

    const safeRoomRows = (roomRows ?? []) as Array<{ is_active: boolean }>;
    const activeRooms = safeRoomRows.filter((room) => room.is_active).length;

    return {
      objects: objectCount ?? propertyRows?.length ?? dashboardStats.objects,
      rooms: safeRoomRows.length,
      activeRooms,
      newRequests:
        ((newRequestRows ?? []) as Array<{
          owner_id: string;
          agent_id: string | null;
          source: "owner" | "agent" | "collection";
          status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
        }>).filter(shouldOwnerSeeRequestAsNew).length,
      publicUrl: buildOwnerPublicPath(profile.slug),
      subscriptionStatus: subscription.status,
      subscriptionStatusLabel: subscription.statusLabel,
      subscriptionPlan: subscription.planName,
      subscriptionValidUntil: subscription.validUntil
        ? formatDateLabel(subscription.validUntil)
        : dashboardStats.subscriptionValidUntil,
      subscriptionWarningText: getSubscriptionWarningText(subscription),
      isCabinetRestricted: subscription.isCabinetRestricted,
      isMutationAllowed: subscription.isMutationAllowed,
    };
  } catch {
    return dashboardStats;
  }
});
