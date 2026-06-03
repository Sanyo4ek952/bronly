"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSupabaseServerClient,
  getAppUrl,
  getAuthUserEmailStatus,
  getCurrentAuthProfile,
  getPostLoginRedirect,
  getPostSignupRedirect,
} from "@/shared/api/supabase";

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

async function getAuthOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return headerStore.get("origin") ?? getAppUrl() ?? "http://localhost:3000";
}

function buildEmailConfirmRedirectTo(origin: string, role: RegisterRole) {
  const next = `/welcome?role=${role}`;
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=credentials");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?error=session");
  }

  revalidatePath("/", "layout");

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login?error=profile");
  }

  redirect(getPostLoginRedirect(profile.roles));
}

export async function signUpAction(formData: FormData) {
  const displayName = getString(formData, "displayName");
  const email = getString(formData, "email");
  const phone = getString(formData, "phone");
  const password = getString(formData, "password");
  const requestedRole = getString(formData, "role");
  const role = isRegisterRole(requestedRole) ? requestedRole : "owner";
  const acceptedTerms = formData.get("acceptedTerms");

  if (!displayName || !email || !password || !acceptedTerms || (requestedRole && !isRegisterRole(requestedRole))) {
    redirect("/register?error=validation");
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(displayName);
  const origin = await getAuthOrigin();
  const emailRedirectTo = buildEmailConfirmRedirectTo(origin, role);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        display_name: displayName,
        phone,
        role,
        slug,
      },
    },
  });

  if (error) {
    redirect("/register?error=signup");
  }

  if (data.session) {
    const profile = await getCurrentAuthProfile();
    redirect(getPostSignupRedirect(profile?.roles ?? [role]));
  }

  if ((await getAuthUserEmailStatus(email)) === "confirmed") {
    redirect(`/login?info=already-confirmed&email=${encodeURIComponent(email)}`);
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}&role=${role}`);
}

export async function resendConfirmationEmailAction(formData: FormData) {
  const email = getString(formData, "email");
  const requestedRole = getString(formData, "role");
  const role = isRegisterRole(requestedRole) ? requestedRole : "owner";

  if (!email || (requestedRole && !isRegisterRole(requestedRole))) {
    redirect("/check-email?error=validation");
  }

  if ((await getAuthUserEmailStatus(email)) === "confirmed") {
    redirect(`/login?info=already-confirmed&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getAuthOrigin();
  const emailRedirectTo = buildEmailConfirmRedirectTo(origin, role);
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  const query = `email=${encodeURIComponent(email)}&role=${role}`;
  if (error) {
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
    redirect(`/${role === "agent" ? "agent/dashboard/settings" : "dashboard/settings"}?error=validation`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      phone,
      whatsapp: phone,
      telegram,
      slug,
    })
    .eq("id", profile.id);

  const targetPath = role === "agent" ? "/agent/dashboard/settings" : "/dashboard/settings";

  if (error) {
    redirect(`${targetPath}?error=save`);
  }

  redirect(`${targetPath}?success=saved`);
}
