import type { MetadataRoute } from "next";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { buildCanonicalUrl } from "@/shared/lib/seo";

type ProfileRow = {
  id: string;
  slug: string | null;
  agent_public_id: string | null;
  is_public_hidden_by_admin: boolean;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const items: MetadataRoute.Sitemap = [
    {
      url: buildCanonicalUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  if (!canUseSupabase()) {
    return items;
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: ownerRoleRows }, { data: agentRoleRows }] = await Promise.all([
    supabase.from("user_roles").select("profile_id").eq("role", "owner"),
    supabase.from("user_roles").select("profile_id").eq("role", "agent"),
  ]);

  const ownerIds = [...new Set((ownerRoleRows ?? []).map((row) => row.profile_id as string))];
  const agentIds = [...new Set((agentRoleRows ?? []).map((row) => row.profile_id as string))];
  const profileIds = [...new Set([...ownerIds, ...agentIds])];

  if (!profileIds.length) {
    return items;
  }

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, slug, agent_public_id, is_public_hidden_by_admin")
    .in("id", profileIds);

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const [ownerStates, agentStates] = await Promise.all([
    Promise.all(ownerIds.map(async (id) => [id, await getSubscriptionRuntimeState(id, "owner")] as const)),
    Promise.all(agentIds.map(async (id) => [id, await getSubscriptionRuntimeState(id, "agent")] as const)),
  ]);

  for (const [ownerId, state] of ownerStates) {
    const profile = profileMap.get(ownerId);

    if (!profile?.slug || profile.is_public_hidden_by_admin || !state.isPublicAllowed) {
      continue;
    }

    items.push({
      url: buildCanonicalUrl(`/p/${encodeURIComponent(profile.slug)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const [agentId, state] of agentStates) {
    const profile = profileMap.get(agentId);

    if (!profile?.agent_public_id || profile.is_public_hidden_by_admin || !state.isPublicAllowed) {
      continue;
    }

    items.push({
      url: buildCanonicalUrl(`/a/${encodeURIComponent(profile.agent_public_id)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return items;
}
