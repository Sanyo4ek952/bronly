import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/shared/api/supabase/env";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";

export type AuthUserEmailStatus = "not_found" | "pending" | "confirmed" | "unavailable";

export async function getAuthUserEmailStatus(email: string): Promise<AuthUserEmailStatus> {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!email.trim()) {
    return "not_found";
  }

  if (!url || !serviceRoleKey) {
    logServerConfigurationError("auth_user_lookup_supabase_not_configured");
    return "unavailable";
  }

  try {
    const response = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email.trim())}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      logServerDataError("auth_user_lookup_request_failed", { status: response.status });
      return "unavailable";
    }

    const data = (await response.json()) as {
      users?: Array<{ email_confirmed_at?: string | null }>;
    };
    const user = data.users?.[0];

    if (!user) {
      return "not_found";
    }

    return user.email_confirmed_at ? "confirmed" : "pending";
  } catch (error) {
    logServerDataError("auth_user_lookup_unhandled_error", error);
    return "unavailable";
  }
}
