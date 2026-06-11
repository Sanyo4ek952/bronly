import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { ensureAuthUserProfile } from "@/shared/api/supabase/ensure-profile";
import { logAuthDiagnostic } from "@/shared/api/supabase/auth-diagnostics";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/shared/api/supabase/env";

export type AuthRole = "owner" | "agent" | "admin";

export type AuthProfile = {
  id: string;
  authUserId: string;
  displayName: string;
  phone: string;
  slug: string;
  agentPublicId: string;
  telegram: string;
  email: string;
  roles: AuthRole[];
};

export function getPrimaryRole(roles: AuthRole[]) {
  if (roles.includes("admin")) {
    return "admin" as const;
  }

  if (roles.includes("owner")) {
    return "owner" as const;
  }

  if (roles.includes("agent")) {
    return "agent" as const;
  }

  return "owner" as const;
}

export function getPostLoginRedirect(roles: AuthRole[]) {
  const role = getPrimaryRole(roles);

  if (role === "admin") {
    return "/admin";
  }

  if (role === "agent") {
    return "/agent/dashboard";
  }

  return "/dashboard";
}

export function getPostSignupRedirect(roles: AuthRole[]) {
  const role = getPrimaryRole(roles);

  return `/welcome?role=${role}`;
}

export async function createSupabaseServerClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase auth environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Server Components cannot set cookies; session refresh runs in actions/routes.
        }
      },
    },
  });
}

export async function getCurrentAuthProfile(): Promise<AuthProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    let { data: profileRow } = await supabase
      .from("profiles")
      .select("id, auth_user_id, display_name, phone, slug, agent_public_id, telegram")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profileRow) {
      logAuthDiagnostic("warn", "profile_missing_for_authenticated_user", {
        authUserId: user.id,
        email: user.email ?? null,
      });
      const ensured = await ensureAuthUserProfile(user);
      if (!ensured) {
        logAuthDiagnostic("error", "profile_auto_create_failed", {
          authUserId: user.id,
          email: user.email ?? null,
        });
        return null;
      }

      const refetch = await supabase
        .from("profiles")
        .select("id, auth_user_id, display_name, phone, slug, agent_public_id, telegram")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      profileRow = refetch.data;
    }

    if (!profileRow) {
      logAuthDiagnostic("error", "profile_refetch_failed_after_ensure", {
        authUserId: user.id,
        email: user.email ?? null,
      });
      return null;
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", profileRow.id);

    return {
      id: profileRow.id as string,
      authUserId: profileRow.auth_user_id as string,
      displayName: (profileRow.display_name as string) ?? "",
      phone: (profileRow.phone as string | null) ?? "",
      slug: (profileRow.slug as string | null) ?? "",
      agentPublicId: (profileRow.agent_public_id as string | null) ?? "",
      telegram: (profileRow.telegram as string | null) ?? "",
      email: user.email ?? "",
      roles: (roleRows ?? []).map((row) => row.role as AuthRole),
    };
  } catch (error) {
    unstable_rethrow(error);
    logAuthDiagnostic("error", "get_current_auth_profile_failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}
