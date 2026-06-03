import { cache } from "react";

import { dashboardStats } from "@/entities/property/model/dashboard";
import type { OwnerDashboardSummary } from "@/entities/property/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { formatDateLabel } from "@/shared/lib/date";

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
      .select("id, slug")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    const firstProperty = (propertyRows ?? [])[0] as { id: string; slug: string } | undefined;

    if (!(propertyRows ?? []).length) {
      const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

      return {
        objects: 0,
        rooms: 0,
        activeRooms: 0,
        newRequests: 0,
        publicUrl: dashboardStats.publicUrl,
        subscriptionStatus: subscription.status,
        subscriptionStatusLabel: subscription.statusLabel,
        subscriptionPlan: subscription.planName,
        subscriptionValidUntil: subscription.validUntil ? formatDateLabel(subscription.validUntil) : dashboardStats.subscriptionValidUntil,
        subscriptionWarningText: subscription.showGraceWarning
          ? "Пробный период закончился. У вас есть 3 дня, чтобы продлить подписку и сохранить доступ к публичным страницам и заявкам."
          : null,
        isCabinetRestricted: subscription.isCabinetRestricted,
        isMutationAllowed: subscription.isMutationAllowed,
      };
    }

    const [{ count: objectCount }, { data: roomRows }, { count: newRequestCount }] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", profile.id),
      supabase.from("rooms").select("id, is_active").in(
        "property_id",
        (propertyRows ?? []).map((row) => row.id),
      ),
      supabase
        .from("guest_requests")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile.id)
        .neq("source", "agent")
        .eq("status", "new"),
    ]);

    const safeRoomRows = (roomRows ?? []) as Array<{ is_active: boolean }>;
    const activeRooms = safeRoomRows.filter((room) => room.is_active).length;
    const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

    return {
      objects: objectCount ?? propertyRows?.length ?? dashboardStats.objects,
      rooms: safeRoomRows.length,
      activeRooms,
      newRequests: newRequestCount ?? 0,
      publicUrl: firstProperty?.slug ? `/p/${firstProperty.slug}` : dashboardStats.publicUrl,
      subscriptionStatus: subscription.status,
      subscriptionStatusLabel: subscription.statusLabel,
      subscriptionPlan: subscription.planName,
      subscriptionValidUntil: subscription.validUntil ? formatDateLabel(subscription.validUntil) : dashboardStats.subscriptionValidUntil,
      subscriptionWarningText: subscription.showGraceWarning
        ? "Пробный период закончился. У вас есть 3 дня, чтобы продлить подписку и сохранить доступ к публичным страницам и заявкам."
        : null,
      isCabinetRestricted: subscription.isCabinetRestricted,
      isMutationAllowed: subscription.isMutationAllowed,
    };
  } catch {
    return dashboardStats;
  }
});
