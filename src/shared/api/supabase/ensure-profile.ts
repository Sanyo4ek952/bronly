import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type { AuthRole } from "@/shared/api/supabase/server-auth";

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

export async function ensureAuthUserProfile(user: User): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (existing?.id) {
    return true;
  }

  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.display_name === "string" && metadata.display_name) ||
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    user.email?.split("@")[0] ||
    "Пользователь";
  const phone =
    (typeof metadata.phone === "string" && metadata.phone) ||
    (typeof metadata.phone_number === "string" && metadata.phone_number) ||
    null;
  const role = (
    typeof metadata.role === "string" && (metadata.role === "agent" || metadata.role === "owner")
      ? metadata.role
      : "owner"
  ) as AuthRole;
  const requestedSlug =
    (typeof metadata.slug === "string" && metadata.slug) || slugify(displayName);
  const slug = await resolveUniqueSlug(admin, slugify(requestedSlug));

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      slug,
      display_name: displayName,
      phone,
      whatsapp: phone,
      telegram: typeof metadata.telegram === "string" ? metadata.telegram : null,
    })
    .select("id")
    .single();

  if (profileError || !profile?.id) {
    return false;
  }

  const { error: roleError } = await admin.from("user_roles").upsert(
    {
      profile_id: profile.id,
      role,
    },
    { onConflict: "profile_id,role" },
  );

  return !roleError;
}
