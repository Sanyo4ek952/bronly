"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSupabaseServerClient,
  getAuthUserEmailStatus,
  getAuthDiagnosticContext,
  getCurrentAuthProfile,
  logAuthDiagnostic,
  getPostLoginRedirect,
  getPostSignupRedirect,
  isBronlyProductionHost,
  redactAuthEmail,
  requireAppUrl,
} from "@/shared/api/supabase";
import { createTelegramLinkSession } from "@/entities/notification";
import { getSubscriptionRuntimeState } from "@/entities/subscription";

type RegisterRole = "owner" | "agent";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function isRegisterRole(value: string): value is RegisterRole {
  return value === "owner" || value === "agent";
}

function getSettingsTargetPath(role: string) {
  return role === "agent" ? "/agent/dashboard/settings" : "/dashboard/settings";
}

function getInternalNextPath(value: string, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

async function getAuthOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";
  const origin = headerStore.get("origin");

  if (forwardedHost) {
    if (isBronlyProductionHost(forwardedHost)) {
      return requireAppUrl();
    }

    return `${forwardedProto}://${forwardedHost}`;
  }

  if (origin) {
    try {
      const url = new URL(origin);

      if (isBronlyProductionHost(url.hostname)) {
        return requireAppUrl();
      }
    } catch {
      return origin;
    }

    return origin;
  }

  return requireAppUrl();
}

function buildEmailConfirmRedirectTo(origin: string, nextPath: string) {
  return `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getInternalNextPath(getString(formData, "next"), "");

  if (!email || !password) {
    redirect("/login?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const context = await getAuthDiagnosticContext();
    const normalizedMessage = error.message.toLowerCase();
    const isEmailNotConfirmed =
      normalizedMessage.includes("email not confirmed") || normalizedMessage.includes("email_not_confirmed");

    logAuthDiagnostic("warn", "sign_in_failed", {
      ...context,
      email: redactAuthEmail(email),
      errorCode: error.code ?? null,
      errorMessage: error.message,
      next: next || null,
    });

    if (isEmailNotConfirmed) {
      redirect(`/login?error=email-not-confirmed&email=${encodeURIComponent(email)}`);
    }

    redirect("/login?error=credentials");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const context = await getAuthDiagnosticContext();
    logAuthDiagnostic("error", "sign_in_missing_session", {
      ...context,
      email: redactAuthEmail(email),
      next: next || null,
    });
    redirect("/login?error=session");
  }

  revalidatePath("/", "layout");

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    const context = await getAuthDiagnosticContext();
    logAuthDiagnostic("error", "sign_in_missing_profile", {
      ...context,
      email: redactAuthEmail(email),
      authUserId: session.user.id,
      next: next || null,
    });
    redirect("/login?error=profile");
  }

  redirect(next || getPostLoginRedirect(profile.roles));
}

export async function signUpAction(formData: FormData) {
  const displayName = getString(formData, "displayName");
  const email = getString(formData, "email");
  const phone = getString(formData, "phone");
  const password = getString(formData, "password");
  const requestedRole = getString(formData, "role");
  const role = isRegisterRole(requestedRole) ? requestedRole : "owner";
  const inviteToken = getString(formData, "invite");
  const acceptedTerms = formData.get("acceptedTerms");

  if (!displayName || !email || !password || !acceptedTerms || (requestedRole && !isRegisterRole(requestedRole))) {
    redirect("/register?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(displayName);
  const origin = await getAuthOrigin();
  const nextPath = inviteToken ? `/invite/${inviteToken}` : `/welcome?role=${role}`;
  const emailRedirectTo = buildEmailConfirmRedirectTo(origin, nextPath);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        display_name: displayName,
        phone,
        role,
        referral_invite_token: inviteToken || undefined,
        ...(role === "owner" ? { slug } : {}),
      },
    },
  });

  if (error) {
    const context = await getAuthDiagnosticContext();
    logAuthDiagnostic("warn", "sign_up_failed", {
      ...context,
      email: redactAuthEmail(email),
      errorCode: error.code ?? null,
      errorMessage: error.message,
      emailRedirectTo,
      role,
      hasInvite: Boolean(inviteToken),
    });
    redirect("/register?error=signup");
  }

  if (data.session) {
    const profile = await getCurrentAuthProfile();
    redirect(inviteToken ? nextPath : getPostSignupRedirect(profile?.roles ?? [role]));
  }

  if ((await getAuthUserEmailStatus(email)) === "confirmed") {
    redirect(`/login?info=already-confirmed&email=${encodeURIComponent(email)}`);
  }

  const inviteQuery = inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : "";
  redirect(`/check-email?email=${encodeURIComponent(email)}&role=${role}${inviteQuery}`);
}

export async function resendConfirmationEmailAction(formData: FormData) {
  const email = getString(formData, "email");
  const requestedRole = getString(formData, "role");
  const role = isRegisterRole(requestedRole) ? requestedRole : "owner";
  const inviteToken = getString(formData, "invite");

  if (!email || (requestedRole && !isRegisterRole(requestedRole))) {
    redirect("/check-email?error=validation");
  }

  if ((await getAuthUserEmailStatus(email)) === "confirmed") {
    redirect(`/login?info=already-confirmed&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getAuthOrigin();
  const nextPath = inviteToken ? `/invite/${inviteToken}` : `/welcome?role=${role}`;
  const emailRedirectTo = buildEmailConfirmRedirectTo(origin, nextPath);
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  const query = `email=${encodeURIComponent(email)}&role=${role}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`;
  if (error) {
    const context = await getAuthDiagnosticContext();
    logAuthDiagnostic("warn", "confirmation_resend_failed", {
      ...context,
      email: redactAuthEmail(email),
      errorCode: error.code ?? null,
      errorMessage: error.message,
      emailRedirectTo,
      role,
      hasInvite: Boolean(inviteToken),
    });
    redirect(`/check-email?${query}&error=resend`);
  }

  redirect(`/check-email?${query}&success=sent`);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirect("/forgot-password?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getAuthOrigin();
  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    const context = await getAuthDiagnosticContext();
    logAuthDiagnostic("warn", "password_reset_request_failed", {
      ...context,
      email: redactAuthEmail(email),
      errorCode: error.code ?? null,
      errorMessage: error.message,
      redirectTo,
    });
    redirect("/forgot-password?error=send");
  }

  redirect("/forgot-password?success=sent");
}

export async function updatePasswordAction(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!password || password.length < 8 || password !== confirmPassword) {
    redirect("/reset-password?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect("/reset-password?error=update");
  }

  const profile = await getCurrentAuthProfile();
  redirect(`${getPostLoginRedirect(profile?.roles ?? ["owner"])}?success=password-updated`);
}

export async function updateProfileAction(formData: FormData) {
  const displayName = getString(formData, "displayName");
  const phone = getString(formData, "phone");
  const telegram = getString(formData, "telegram");
  const slug = getString(formData, "slug");
  const role = getString(formData, "role");

  const profile = await getCurrentAuthProfile();

  if (!profile || !displayName) {
    redirect(`${getSettingsTargetPath(role)}?error=validation`);
  }

  if (role === "owner" || role === "agent") {
    const subscription = await getSubscriptionRuntimeState(profile.id, role);

    if (!subscription.isMutationAllowed) {
      redirect(`${getSettingsTargetPath(role)}?error=subscription`);
    }
  }

  const payload: {
    display_name: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    slug?: string;
  } = {
    display_name: displayName,
    phone,
    whatsapp: phone,
    telegram,
  };

  if (role !== "agent") {
    payload.slug = slug;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", profile.id);

  const targetPath = getSettingsTargetPath(role);

  if (error) {
    redirect(`${targetPath}?error=save`);
  }

  redirect(`${targetPath}?success=saved`);
}

export async function startTelegramNotificationLinkAction(formData: FormData) {
  const role = getString(formData, "role");
  const targetPath = getSettingsTargetPath(role);
  const result = await createTelegramLinkSession();

  if (!result.ok || !result.url) {
    const errorCode = result.reason === "not_configured" ? "telegram-not-configured" : "telegram-link";
    redirect(`${targetPath}?error=${errorCode}`);
  }

  redirect(result.url);
}
