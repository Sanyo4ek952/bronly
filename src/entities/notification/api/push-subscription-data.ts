import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getCurrentAuthProfile,
  hasConfiguredWebPush,
  type SupabaseNotificationSettingsRow,
  type SupabasePushSubscriptionRow,
} from "@/shared/api/supabase";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { ensureNotificationSettings } from "@/entities/notification/api/notification-settings";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string | null;
  deviceLabel?: string | null;
};

export type PushSubscriptionStatus = {
  pushEnabled: boolean;
  hasSubscriptions: boolean;
  deliveryMode: "enabled" | "foundation_only";
};

function getDefaultStatus(): PushSubscriptionStatus {
  return {
    pushEnabled: true,
    hasSubscriptions: false,
    deliveryMode: hasConfiguredWebPush() ? "enabled" : "foundation_only",
  };
}

export async function getMyPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return getDefaultStatus();
  }

  const supabase = await createSupabaseServerClient();
  const [settingsResult, subscriptionsResult] = await Promise.all([
    supabase.from("notification_settings").select("*").eq("profile_id", profile.id).maybeSingle(),
    supabase.from("push_subscriptions").select("*", { count: "exact", head: true }).eq("profile_id", profile.id),
  ]);

  if (settingsResult.error || subscriptionsResult.error) {
    throw settingsResult.error ?? subscriptionsResult.error;
  }

  const settings = settingsResult.data ?? null;

  return {
    pushEnabled: settings?.push_enabled ?? true,
    hasSubscriptions: (subscriptionsResult.count ?? 0) > 0,
    deliveryMode: hasConfiguredWebPush() ? "enabled" : "foundation_only",
  };
}

export async function savePushSubscription(input: PushSubscriptionInput) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!input.endpoint || !input.keys.p256dh || !input.keys.auth) {
    return { ok: false as const, reason: "validation_failed" as const };
  }

  await ensureNotificationSettings(profile.id);

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      profile_id: profile.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: input.userAgent ?? null,
      device_label: input.deviceLabel ?? null,
      last_seen_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    logServerDataError("push_subscription_save_failed", error);
    return { ok: false as const, reason: "save_failed" as const };
  }

  const { error: settingsError } = await admin
    .from("notification_settings")
    .update({ push_enabled: true, updated_at: nowIso })
    .eq("profile_id", profile.id);

  if (settingsError) {
    logServerDataError("push_notification_setting_enable_failed", settingsError);
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function deletePushSubscription(endpoint: string) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!endpoint) {
    return { ok: false as const, reason: "validation_failed" as const };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("profile_id", profile.id)
    .eq("endpoint", endpoint);

  if (error) {
    logServerDataError("push_subscription_delete_failed", error);
    return { ok: false as const, reason: "delete_failed" as const };
  }

  const { count, error: countError } = await admin
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id);

  if (countError) {
    logServerDataError("push_subscription_count_failed", countError);
    return { ok: false as const, reason: "delete_failed" as const };
  }

  await ensureNotificationSettings(profile.id);
  const { error: settingsError } = await admin
    .from("notification_settings")
    .update({ push_enabled: (count ?? 0) > 0, updated_at: new Date().toISOString() })
    .eq("profile_id", profile.id);

  if (settingsError) {
    logServerDataError("push_notification_setting_disable_failed", settingsError);
    return { ok: false as const, reason: "delete_failed" as const };
  }

  return { ok: true as const };
}

export async function listMyPushSubscriptions() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("profile_id", profile.id)
    .order("updated_at", { ascending: false });

  return data ?? [];
}
