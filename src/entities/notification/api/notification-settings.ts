import { createSupabaseAdminClient } from "@/shared/api/supabase";

export async function ensureNotificationSettings(profileId: string) {
  const admin = createSupabaseAdminClient();

  await admin.from("notification_settings").upsert(
    {
      profile_id: profileId,
      push_enabled: true,
      in_app_enabled: true,
      telegram_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
}
