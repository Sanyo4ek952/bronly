import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/shared/api/supabase/server";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "user"
  );
}

async function resolveUniqueSlug(admin: ReturnType<typeof createSupabaseAdminClient>, baseSlug: string) {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const { data } = await admin.from("profiles").select("id").eq("slug", slug).maybeSingle();
    if (!data) {
      return slug;
    }
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function generateAgentPublicIdCandidate() {
  return `ag_${Math.random().toString(36).slice(2, 8)}`;
}

async function resolveUniqueAgentPublicId(admin: ReturnType<typeof createSupabaseAdminClient>) {
  while (true) {
    const candidate = generateAgentPublicIdCandidate();
    const { data } = await admin.from("profiles").select("id").eq("agent_public_id", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }
}

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export async function ensureAuthUserProfile(user: User): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  const metadata = user.user_metadata ?? {};
  const role: "agent" | "owner" =
    typeof metadata.role === "string" && (metadata.role === "agent" || metadata.role === "owner")
      ? metadata.role
      : "owner";

  if (existing?.id) {
    return existing.id;
  }

  const displayName =
    (typeof metadata.display_name === "string" && metadata.display_name) ||
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    user.email?.split("@")[0] ||
    "Пользователь";
  const phone =
    (typeof metadata.phone === "string" && metadata.phone) ||
    (typeof metadata.phone_number === "string" && metadata.phone_number) ||
    null;
  const requestedSlug =
    (typeof metadata.slug === "string" && metadata.slug) || slugify(displayName);
  const slug = await resolveUniqueSlug(admin, slugify(requestedSlug));
  const agentPublicId = role === "agent" ? await resolveUniqueAgentPublicId(admin) : null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      slug,
      agent_public_id: agentPublicId,
      display_name: displayName,
      phone,
      whatsapp: phone,
      telegram: typeof metadata.telegram === "string" ? metadata.telegram : null,
    })
    .select("id")
    .single();

  if (profileError || !profile?.id) {
    return null;
  }

  const { error: roleError } = await admin.from("user_roles").upsert(
    {
      profile_id: profile.id,
      role,
    },
    { onConflict: "profile_id,role" },
  );

  if (roleError) {
    return null;
  }

  const now = new Date();
  const { error: subscriptionError } = await admin.from("subscriptions").upsert(
    {
      profile_id: profile.id,
      role_context: role,
      status: "trial",
      plan_name: "Старт",
      active_room_limit: 3,
      trial_ends_at: addDays(now, 14).toISOString(),
      grace_ends_at: addDays(now, 17).toISOString(),
      paid_until: null,
      updated_at: now.toISOString(),
    },
    { onConflict: "profile_id,role_context" },
  );

  if (subscriptionError) {
    return null;
  }

  return profile.id;
}
