"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createInAppNotification } from "@/entities/notification";
import { createSupabaseAdminClient, getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";

const ALLOWED_SUBSCRIPTION_STATUSES = new Set(["trial", "active", "grace", "expired", "manual"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function requireAdmin() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.roles.includes("admin")) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  return profile;
}

export async function saveSubscriptionAction(formData: FormData) {
  await requireAdmin();

  const profileId = getString(formData, "profileId");
  const roleContext = getString(formData, "roleContext");
  const status = getString(formData, "status");
  const planName = getString(formData, "planName") || "MVP";
  const activeRoomLimit = getNullableInteger(formData, "activeRoomLimit");

  if (
    !profileId ||
    (roleContext !== "owner" && roleContext !== "agent") ||
    !ALLOWED_SUBSCRIPTION_STATUSES.has(status) ||
    (activeRoomLimit != null && activeRoomLimit < 0)
  ) {
    redirect("/admin?error=subscription");
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  const existingRow = existingData as {
    status: "trial" | "active" | "grace" | "expired" | "manual";
    trial_ends_at: string | null;
    grace_ends_at: string | null;
    paid_until: string | null;
  } | null;

  const payload = {
    profile_id: profileId,
    role_context: roleContext,
    status,
    plan_name: planName,
    active_room_limit: activeRoomLimit,
    trial_ends_at: existingRow?.trial_ends_at ?? null,
    grace_ends_at: status === "grace" ? existingRow?.grace_ends_at ?? null : null,
    paid_until: status === "expired" ? existingRow?.paid_until ?? null : existingRow?.paid_until ?? null,
    updated_at: nowIso,
  };

  const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "profile_id,role_context" });

  if (error) {
    redirect("/admin?error=subscription");
  }

  if (existingRow?.status !== status) {
    await createInAppNotification({
      recipientId: profileId,
      eventType: "subscription_status_changed",
      payload: {
        subscriptionStatus: status as "trial" | "active" | "grace" | "expired" | "manual",
        roleContext: roleContext as "owner" | "agent",
        linkPath: roleContext === "agent" ? "/agent/dashboard" : "/dashboard",
      },
    });

    if (status === "grace") {
      await createInAppNotification({
        recipientId: profileId,
        eventType: "subscription_reminder",
        payload: {
          subscriptionStatus: "grace",
          roleContext: roleContext as "owner" | "agent",
          linkPath: roleContext === "agent" ? "/agent/dashboard" : "/dashboard",
        },
      });
    }
  }

  revalidatePath("/admin");
  redirect("/admin?success=subscription-saved");
}

export async function extendSubscriptionAction(formData: FormData) {
  await requireAdmin();

  const profileId = getString(formData, "profileId");
  const roleContext = getString(formData, "roleContext");

  if (!profileId || (roleContext !== "owner" && roleContext !== "agent")) {
    redirect("/admin?error=subscription");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  const existingRow = existingData as {
    status: "trial" | "active" | "grace" | "expired" | "manual";
    trial_ends_at: string | null;
    paid_until: string | null;
    plan_name: string;
    active_room_limit: number | null;
  } | null;

  const baseDate = existingRow?.paid_until ? new Date(existingRow.paid_until) : now;
  const nextPaidUntil = new Date(Math.max(baseDate.getTime(), now.getTime()));
  nextPaidUntil.setDate(nextPaidUntil.getDate() + 30);

  const payload = {
    profile_id: profileId,
    role_context: roleContext,
    status: "active",
    plan_name: existingRow?.plan_name ?? "MVP",
    active_room_limit: existingRow?.active_room_limit ?? null,
    trial_ends_at: existingRow?.trial_ends_at ?? null,
    grace_ends_at: null,
    paid_until: nextPaidUntil.toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "profile_id,role_context" });

  if (error) {
    redirect("/admin?error=subscription");
  }

  if (existingRow?.status !== "active") {
    await createInAppNotification({
      recipientId: profileId,
      eventType: "subscription_status_changed",
      payload: {
        subscriptionStatus: "active",
        roleContext: roleContext as "owner" | "agent",
        linkPath: roleContext === "agent" ? "/agent/dashboard" : "/dashboard",
      },
    });
  }

  revalidatePath("/admin");
  redirect("/admin?success=subscription-extended");
}

export async function togglePropertyFreezeAction(formData: FormData) {
  await requireAdmin();

  const propertyId = getString(formData, "propertyId");
  const nextFrozen = getString(formData, "nextFrozen") === "true";

  if (!propertyId) {
    redirect("/admin?error=property");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("properties")
    .update({
      is_frozen: nextFrozen,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    redirect("/admin?error=property");
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${nextFrozen ? "property-frozen" : "property-unfrozen"}`);
}
