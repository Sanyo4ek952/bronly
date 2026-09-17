"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildNotificationIdempotencyKey, createNotificationEvent } from "@/entities/notification";
import { reviewReferralReward } from "@/entities/referral";
import { buildSubscriptionSchedule } from "@/entities/subscription";
import { createSupabaseAdminClient, getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";

const ALLOWED_SUBSCRIPTION_STATUSES = new Set(["trial", "active", "grace", "expired"]);

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

function getNullableDateIso(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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

async function revalidateSubscriptionSurfaces(input: {
  profileId: string;
  roleContext: "owner" | "agent";
}) {
  const admin = createSupabaseAdminClient();
  const { data: profileData } = await admin
    .from("profiles")
    .select("slug, agent_public_id")
    .eq("id", input.profileId)
    .maybeSingle();

  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");

  if (input.roleContext === "agent") {
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/subscription");

    if (profileData?.agent_public_id) {
      revalidatePath(`/a/${profileData.agent_public_id}`);
    }

    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");

  if (profileData?.slug) {
    revalidatePath(`/p/${profileData.slug}`);
  }
}

export async function saveSubscriptionAction(formData: FormData) {
  await requireAdmin();

  const profileId = getString(formData, "profileId");
  const roleContext = getString(formData, "roleContext");
  const status = getString(formData, "status");
  const roomLimitOverride = getNullableInteger(formData, "roomLimitOverride");
  const paidUntilInput = getNullableDateIso(formData, "paidUntil");
  const graceEndsAtInput = getNullableDateIso(formData, "graceEndsAt");

  if (
    !profileId ||
    (roleContext !== "owner" && roleContext !== "agent") ||
    !ALLOWED_SUBSCRIPTION_STATUSES.has(status) ||
    (roomLimitOverride != null && roomLimitOverride <= 15)
  ) {
    redirect("/admin/subscriptions?error=subscription");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  const existingRow = existingData as {
    status: "trial" | "active" | "grace" | "expired";
    trial_ends_at: string | null;
    grace_ends_at: string | null;
    paid_until: string | null;
  } | null;

  const normalizedStatus = status as "trial" | "active" | "grace" | "expired";
  const schedule = buildSubscriptionSchedule({
    status: normalizedStatus,
    now,
    trialEndsAt: existingRow?.trial_ends_at ?? null,
    graceEndsAt: graceEndsAtInput ?? existingRow?.grace_ends_at ?? null,
    paidUntil: paidUntilInput ?? existingRow?.paid_until ?? null,
  });

  const payload = {
    profile_id: profileId,
    role_context: roleContext as "owner" | "agent",
    status: normalizedStatus,
    room_limit_override: roomLimitOverride,
    trial_ends_at: schedule.trialEndsAt,
    grace_ends_at: schedule.graceEndsAt,
    paid_until: schedule.paidUntil,
    updated_at: nowIso,
  };

  const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "profile_id,role_context" });

  if (error) {
    redirect("/admin/subscriptions?error=subscription");
  }

  if (existingRow?.status !== status) {
    await createNotificationEvent({
      recipientId: profileId,
      eventType: "subscription_status_changed",
      idempotencyKey: buildNotificationIdempotencyKey({
        eventType: "subscription_status_changed",
        sourceId: `${profileId}:${roleContext}:${status}`,
        occurrence: nowIso,
      }),
      payload: {
        subscriptionStatus: status as "trial" | "active" | "grace" | "expired",
        roleContext: roleContext as "owner" | "agent",
      },
    });

    if (status === "grace") {
      await createNotificationEvent({
        recipientId: profileId,
        eventType: "subscription_reminder",
        idempotencyKey: buildNotificationIdempotencyKey({
          eventType: "subscription_reminder",
          sourceId: `${profileId}:${roleContext}:grace`,
          occurrence: nowIso,
        }),
        payload: {
          subscriptionStatus: "grace",
          roleContext: roleContext as "owner" | "agent",
        },
      });
    }
  }

  await revalidateSubscriptionSurfaces({
    profileId,
    roleContext: roleContext as "owner" | "agent",
  });
  redirect("/admin/subscriptions?success=subscription-saved");
}

export async function extendSubscriptionAction(formData: FormData) {
  const adminProfile = await requireAdmin();

  const profileId = getString(formData, "profileId");
  const roleContext = getString(formData, "roleContext");
  const extensionDays = getNullableInteger(formData, "extensionDays");

  if (!profileId || (roleContext !== "owner" && roleContext !== "agent") || (extensionDays !== 30 && extensionDays !== 365)) {
    redirect("/admin/subscriptions?error=subscription");
  }

  const admin = createSupabaseAdminClient();
  const extensionOccurredAt = new Date().toISOString();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("role_context", roleContext)
    .maybeSingle();

  const existingRow = existingData;
  const { error } = await admin.rpc("admin_extend_subscription", {
    p_profile_id: profileId,
    p_role_context: roleContext,
    p_actor_profile_id: adminProfile.id,
    p_extension_days: extensionDays,
  });

  if (error) {
    redirect("/admin/subscriptions?error=subscription");
  }

  if (existingRow?.status !== "active") {
    await createNotificationEvent({
      recipientId: profileId,
      eventType: "subscription_status_changed",
      idempotencyKey: buildNotificationIdempotencyKey({
        eventType: "subscription_status_changed",
        sourceId: `${profileId}:${roleContext}:active`,
        occurrence: extensionOccurredAt,
      }),
      payload: {
        subscriptionStatus: "active",
        roleContext: roleContext as "owner" | "agent",
      },
    });
  }

  await revalidateSubscriptionSurfaces({
    profileId,
    roleContext: roleContext as "owner" | "agent",
  });
  redirect(`/admin/subscriptions?success=${extensionDays === 365 ? "subscription-extended-year" : "subscription-extended-month"}`);
}

export async function togglePropertyFreezeAction(formData: FormData) {
  const adminProfile = await requireAdmin();

  const propertyId = getString(formData, "propertyId");
  const nextFrozen = getString(formData, "nextFrozen") === "true";

  if (!propertyId) {
    redirect("/admin/properties?error=property");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("admin_set_property_frozen", {
    p_property_id: propertyId,
    p_frozen: nextFrozen,
    p_actor_profile_id: adminProfile.id,
  });

  if (error || !data || data === "not_found") {
    redirect("/admin/properties?error=property");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath("/p/[slug]", "page");
  revalidatePath("/a/[slug]", "page");
  revalidatePath("/c/[slug]", "page");
  const success = data === "already_frozen" || data === "already_unfrozen"
    ? `property-${data}`
    : nextFrozen ? "property-frozen" : "property-unfrozen";
  redirect(`/admin/properties?success=${success}`);
}

export async function toggleProfilePublicVisibilityAction(formData: FormData) {
  const adminProfile = await requireAdmin();

  const profileId = getString(formData, "profileId");
  const nextHidden = getString(formData, "nextHidden") === "true";

  if (!profileId) {
    redirect("/admin/users?error=profile");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("admin_set_profile_public_visibility", {
    p_profile_id: profileId,
    p_hidden: nextHidden,
    p_actor_profile_id: adminProfile.id,
  });

  if (error || !data || data === "not_found") {
    redirect("/admin/users?error=profile");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/p/[slug]", "page");
  revalidatePath("/a/[slug]", "page");
  revalidatePath("/c/[slug]", "page");
  const success = data === "already_hidden" || data === "already_visible"
    ? `profile-${data}`
    : nextHidden ? "profile-hidden" : "profile-unhidden";
  redirect(`/admin/users?success=${success}`);
}

async function notifyAndRevalidateReferralExtension(rewardId: string) {
  const admin = createSupabaseAdminClient();
  const { data: reward, error } = await admin
    .from("referral_rewards")
    .select("inviter_profile_id, applied_role_contexts, approved_at")
    .eq("id", rewardId)
    .maybeSingle();

  if (error) {
    logServerDataError("referral_reward_notification_lookup_failed", error, { rewardId });
    return;
  }

  if (!reward) {
    return;
  }

  const roleContexts = reward.applied_role_contexts.filter(
    (roleContext): roleContext is "owner" | "agent" => roleContext === "owner" || roleContext === "agent",
  );

  await Promise.all(roleContexts.map(async (roleContext) => {
    await createNotificationEvent({
      recipientId: reward.inviter_profile_id,
      eventType: "subscription_status_changed",
      idempotencyKey: buildNotificationIdempotencyKey({
        eventType: "subscription_status_changed",
        sourceId: `referral:${rewardId}:${roleContext}:active`,
        occurrence: reward.approved_at ?? rewardId,
      }),
      payload: {
        subscriptionStatus: "active",
        roleContext,
      },
    });

    await revalidateSubscriptionSurfaces({
      profileId: reward.inviter_profile_id,
      roleContext,
    });
  }));
}

export async function reviewReferralRewardAction(formData: FormData) {
  const profile = await requireAdmin();
  const rewardId = getString(formData, "rewardId");
  const decision = getString(formData, "decision");

  if (!rewardId || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin/reviews?error=referral");
  }

  const result = await reviewReferralReward({
    rewardId,
    decision,
    adminProfileId: profile.id,
  });

  if (!result || result === "not_found") {
    redirect("/admin/reviews?error=referral");
  }

  if (result === "conflict_approved" || result === "conflict_rejected") {
    redirect("/admin/reviews?error=referral-state");
  }

  if (result === "approved" || result === "already_approved") {
    await notifyAndRevalidateReferralExtension(rewardId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/subscriptions");

  if (result === "already_approved" || result === "already_rejected") {
    redirect(`/admin/reviews?success=referral-${result}`);
  }

  redirect(`/admin/reviews?success=${decision === "approved" ? "referral-approved" : "referral-rejected"}`);
}
