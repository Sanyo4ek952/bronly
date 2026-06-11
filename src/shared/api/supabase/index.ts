export {
  getAppUrl,
  getCanonicalAppUrl,
  getDemoPropertySlug,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getTelegramBotToken,
  getTelegramBotUsername,
  getTelegramWebhookSecret,
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  hasConfiguredTelegramBot,
  hasConfiguredWebPush,
  hasSupabaseServerEnv,
  requireAppUrl,
} from "@/shared/api/supabase/env";
export { createSupabaseAdminClient, canUseSupabase } from "@/shared/api/supabase/server";
export { createSupabaseBrowserClient } from "@/shared/api/supabase/browser";
export { ensureAuthUserProfile } from "@/shared/api/supabase/ensure-profile";
export { getAuthUserEmailStatus } from "@/shared/api/supabase/auth-lookup";
export { getAuthDiagnosticContext, logAuthDiagnostic, redactAuthEmail } from "@/shared/api/supabase/auth-diagnostics";
export {
  createSupabaseServerClient,
  getCurrentAuthProfile,
  getPostLoginRedirect,
  getPostSignupRedirect,
  getPrimaryRole,
} from "@/shared/api/supabase/server-auth";
export type { AuthProfile, AuthRole } from "@/shared/api/supabase/server-auth";
export type {
  SupabaseAgentPropertyLinkRow,
  SupabaseCollectionItemRow,
  SupabaseCollectionRow,
  SupabaseGuestRequestRow,
  SupabaseNotificationDeliveryRow,
  SupabaseNotificationSettingsRow,
  SupabaseNotificationRow,
  SupabaseProfileRow,
  SupabasePropertyPhotoRow,
  SupabasePropertyFeatureRow,
  SupabasePropertyRow,
  SupabasePushSubscriptionRow,
  SupabaseReferralInviteRow,
  SupabaseReferralRewardRow,
  SupabasePropertyRuleRow,
  SupabaseRoomAgentMarkupRow,
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
  SupabaseSubscriptionRow,
  SupabaseTelegramNotificationConnectionRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase/types";
