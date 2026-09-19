"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildNotificationIdempotencyKey, createNotificationEvent } from "@/entities/notification";
import { reviewReferralReward } from "@/entities/referral";
import { createSupabaseAdminClient, getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";

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

  const parsed = new Date(`${value}T12:00:00.000Z`);
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

async function revalidateSubscriptionSurfaces(profileId: string) {
  const admin = createSupabaseAdminClient();
  const [{ data: profileData }, { data: roleRows }] = await Promise.all([
    admin.from("profiles").select("slug, agent_public_id").eq("id", profileId).maybeSingle(),
    admin.from("user_roles").select("role").eq("profile_id", profileId),
  ]);
  const roles = (roleRows ?? []).map((row) => row.role);

  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/subscriptions/${profileId}`);

  if (roles.includes("agent")) {
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/subscription");

    if (profileData?.agent_public_id) {
      revalidatePath(`/a/${profileData.agent_public_id}`);
    }

  }

  if (roles.includes("owner")) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subscription");

    if (profileData?.slug) {
      revalidatePath(`/p/${profileData.slug}`);
    }
  }
}

async function notifySubscriptionActive(profileId: string, occurrence: string, source: string) {
  const admin = createSupabaseAdminClient();
  const { data: roles } = await admin.from("user_roles").select("role").eq("profile_id", profileId);
  const roleContext = roles?.some((row) => row.role === "owner") ? "owner" : "agent";

  await createNotificationEvent({
    recipientId: profileId,
    eventType: "subscription_status_changed",
    idempotencyKey: buildNotificationIdempotencyKey({
      eventType: "subscription_status_changed",
      sourceId: `${source}:${profileId}:active`,
      occurrence,
    }),
    payload: { subscriptionStatus: "active", roleContext },
  });
}

function subscriptionRedirect(profileId: string, result: "success" | "error", code: string) {
  redirect(`/admin/subscriptions?${result}=${code}&focus=${profileId}`);
}

export async function startSubscriptionTrialAction(formData: FormData) {
  const adminProfile = await requireAdmin();
  const profileId = getString(formData, "profileId");
  if (!profileId) {
    subscriptionRedirect(profileId, "error", "subscription");
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_start_subscription_trial", {
    p_profile_id: profileId,
    p_actor_profile_id: adminProfile.id,
  });
  if (error) subscriptionRedirect(profileId, "error", "subscription");
  await revalidateSubscriptionSurfaces(profileId);
  subscriptionRedirect(profileId, "success", "subscription-trial-started");
}

export async function recordSubscriptionPaymentAction(formData: FormData) {
  const adminProfile = await requireAdmin();
  const profileId = getString(formData, "profileId");
  const billingPeriod = getString(formData, "billingPeriod");
  const paymentMethod = getString(formData, "paymentMethod");
  const paidAt = getNullableDateIso(formData, "paidAt") ?? new Date().toISOString();
  if (!profileId || !["month", "year"].includes(billingPeriod) || !["bank_transfer", "cash", "other"].includes(paymentMethod)) {
    subscriptionRedirect(profileId, "error", "payment");
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_record_subscription_payment", {
    p_profile_id: profileId,
    p_actor_profile_id: adminProfile.id,
    p_billing_period: billingPeriod,
    p_payment_method: paymentMethod,
    p_paid_at: paidAt,
    p_external_reference: getString(formData, "externalReference"),
    p_note: getString(formData, "note"),
    p_idempotency_key: crypto.randomUUID(),
  });
  if (error) subscriptionRedirect(profileId, "error", "payment");
  await notifySubscriptionActive(profileId, paidAt, `payment:${billingPeriod}`);
  await revalidateSubscriptionSurfaces(profileId);
  subscriptionRedirect(profileId, "success", billingPeriod === "year" ? "payment-year-recorded" : "payment-month-recorded");
}

export async function grantSubscriptionDaysAction(formData: FormData) {
  const adminProfile = await requireAdmin();
  const profileId = getString(formData, "profileId");
  const extensionDays = getNullableInteger(formData, "extensionDays");
  const reason = getString(formData, "reason");
  if (!profileId || extensionDays == null || extensionDays < 1 || extensionDays > 3650 || !reason) {
    subscriptionRedirect(profileId, "error", "extension");
  }
  const admin = createSupabaseAdminClient();
  const occurredAt = new Date().toISOString();
  const { error } = await admin.rpc("admin_grant_subscription_extension", {
    p_profile_id: profileId,
    p_actor_profile_id: adminProfile.id,
    p_extension_days: extensionDays!,
    p_reason: reason,
    p_source: "admin_subscription_page",
  });
  if (error) subscriptionRedirect(profileId, "error", "extension");
  await notifySubscriptionActive(profileId, occurredAt, `free-extension:${reason}`);
  await revalidateSubscriptionSurfaces(profileId);
  subscriptionRedirect(profileId, "success", "subscription-days-added");
}

export async function setSubscriptionRoomLimitAction(formData: FormData) {
  const adminProfile = await requireAdmin();
  const profileId = getString(formData, "profileId");
  const roomLimitOverride = getNullableInteger(formData, "roomLimitOverride");
  const reason = getString(formData, "reason");
  if (!profileId || (roomLimitOverride != null && roomLimitOverride <= 15) || !reason) {
    subscriptionRedirect(profileId, "error", "limit");
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_set_subscription_room_limit", {
    p_profile_id: profileId,
    p_actor_profile_id: adminProfile.id,
    p_room_limit_override: roomLimitOverride,
    p_reason: reason,
  });
  if (error) subscriptionRedirect(profileId, "error", "limit");
  await revalidateSubscriptionSurfaces(profileId);
  subscriptionRedirect(profileId, "success", "subscription-limit-saved");
}

export async function endSubscriptionAccessAction(formData: FormData) {
  const adminProfile = await requireAdmin();
  const profileId = getString(formData, "profileId");
  const reason = getString(formData, "reason");
  if (!profileId || !reason) subscriptionRedirect(profileId, "error", "end-access");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_end_subscription_access", {
    p_profile_id: profileId,
    p_actor_profile_id: adminProfile.id,
    p_reason: reason,
  });
  if (error) subscriptionRedirect(profileId, "error", "end-access");
  await revalidateSubscriptionSurfaces(profileId);
  subscriptionRedirect(profileId, "success", "subscription-access-ended");
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
    .select("inviter_profile_id, approved_at")
    .eq("id", rewardId)
    .maybeSingle();

  if (error) {
    logServerDataError("referral_reward_notification_lookup_failed", error, { rewardId });
    return;
  }

  if (!reward) {
    return;
  }

  await notifySubscriptionActive(reward.inviter_profile_id, reward.approved_at ?? rewardId, `referral:${rewardId}`);
  await revalidateSubscriptionSurfaces(reward.inviter_profile_id);
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
