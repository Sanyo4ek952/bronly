import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ensureAuthUserProfile, getSupabaseAnonKey, getSupabaseUrl } from "@/shared/api/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
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
      return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
    }

    await ensureAuthUserProfile(data.user);
    return response;
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "email",
  });

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth-confirm", request.url));
  }

  await ensureAuthUserProfile(data.user);
  return response;
}
