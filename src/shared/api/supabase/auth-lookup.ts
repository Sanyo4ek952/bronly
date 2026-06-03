import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/shared/api/supabase/env";

export type AuthUserEmailStatus = "not_found" | "pending" | "confirmed";

export async function getAuthUserEmailStatus(email: string): Promise<AuthUserEmailStatus> {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey || !email.trim()) {
    return "not_found";
  }

  const response = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email.trim())}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return "not_found";
  }

  const data = (await response.json()) as {
    users?: Array<{ email_confirmed_at?: string | null }>;
  };
  const user = data.users?.[0];

  if (!user) {
    return "not_found";
  }

  return user.email_confirmed_at ? "confirmed" : "pending";
}
