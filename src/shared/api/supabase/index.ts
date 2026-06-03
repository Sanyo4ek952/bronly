export {
  getAppUrl,
  getDemoPropertySlug,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
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
  SupabaseCollectionRow,
  SupabaseGuestRequestRow,
  SupabaseProfileRow,
  SupabasePropertyFeatureRow,
  SupabasePropertyRow,
  SupabasePropertyRuleRow,
  SupabaseRoomAmenityRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomRow,
  SupabaseRoomSeasonalPriceRow,
  SupabaseSubscriptionRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase/types";
