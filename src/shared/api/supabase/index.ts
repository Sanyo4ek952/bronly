export {
  getAppUrl,
  getDemoPropertySlug,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  hasConfiguredWebPush,
  hasSupabaseServerEnv,
} from "@/shared/api/supabase/env";
export { createSupabaseAdminClient, canUseSupabase } from "@/shared/api/supabase/server";
export { createSupabaseBrowserClient } from "@/shared/api/supabase/browser";
export { ensureAuthUserProfile } from "@/shared/api/supabase/ensure-profile";
export { getAuthUserEmailStatus } from "@/shared/api/supabase/auth-lookup";
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
  SupabasePropertyRuleRow,
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
  SupabaseSubscriptionRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase/types";
