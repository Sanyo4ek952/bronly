import { createSupabaseAdminClient } from "@/shared/api/supabase";
import { getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";

export async function ensureNotificationSettings(profileId: string) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("notification_settings").upsert(
    { profile_id: profileId },
    { onConflict: "profile_id", ignoreDuplicates: true },
  );

  if (error) {
    logServerDataError("notification_settings_ensure_failed", error);
    throw error;
  }
}

export async function setTelegramNotificationsEnabled(enabled: boolean) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  try {
    await ensureNotificationSettings(profile.id);
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("notification_settings")
      .update({ telegram_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("profile_id", profile.id);

    if (error) {
      logServerDataError("telegram_notification_setting_save_failed", error);
      return { ok: false as const, reason: "save_failed" as const };
    }

    return { ok: true as const };
  } catch (error) {
    logServerDataError("telegram_notification_setting_unhandled_error", error);
    return { ok: false as const, reason: "save_failed" as const };
  }
}
