import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  ensureAuthUserProfile,
  getSupabaseAnonKey,
  getSupabaseUrl,
  logAuthDiagnostic,
} from "@/shared/api/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const next = searchParams.get("next") ?? "/dashboard";

    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!url || !anonKey) {
      logAuthDiagnostic("error", "auth_confirm_missing_env", {
        requestUrl: request.url,
      });
      return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
    }

    const response = NextResponse.redirect(new URL(next, request.url));
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    });

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        logAuthDiagnostic("warn", "auth_confirm_exchange_failed", {
          requestUrl: request.url,
          hasCode: true,
          errorCode: error?.code ?? null,
          errorMessage: error?.message ?? null,
        });
        return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
      }

      const ensured = await ensureAuthUserProfile(data.user);

      if (!ensured) {
        logAuthDiagnostic("error", "auth_confirm_profile_ensure_failed", {
          requestUrl: request.url,
          authUserId: data.user.id,
        });
        return NextResponse.redirect(new URL("/login?error=profile", request.url));
      }

      return response;
    }

    if (!tokenHash || !type) {
      logAuthDiagnostic("warn", "auth_confirm_missing_token", {
        requestUrl: request.url,
        hasTokenHash: Boolean(tokenHash),
        type: type ?? null,
      });
      return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "recovery" | "email",
    });

    if (error || !data.user) {
      logAuthDiagnostic("warn", "auth_confirm_verify_failed", {
        requestUrl: request.url,
        type,
        errorCode: error?.code ?? null,
        errorMessage: error?.message ?? null,
      });
      return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
    }

    const ensured = await ensureAuthUserProfile(data.user);

    if (!ensured) {
      logAuthDiagnostic("error", "auth_confirm_profile_ensure_failed", {
        requestUrl: request.url,
        authUserId: data.user.id,
        type,
      });
      return NextResponse.redirect(new URL("/login?error=profile", request.url));
    }

    return response;
  } catch {
    logAuthDiagnostic("error", "auth_confirm_unhandled_error", {
      requestUrl: request.url,
    });
    return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
  }
}
