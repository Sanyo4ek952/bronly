import type { AgentCollaborationItem, AgentDashboardSummary } from "@/entities/collaboration/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import type { AuthProfile } from "@/shared/api/supabase/server-auth";

export async function getAgentDashboardSummary(profile: AuthProfile): Promise<AgentDashboardSummary> {
  if (!canUseSupabase()) {
    return {
      activeCollaborations: 0,
      incomingRequests: 0,
      completedDeals: 0,
      publicLinkLabel: "Появится после подключения объектов",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ count: activeCollaborations }, { count: incomingRequests }, { count: completedDeals }] =
      await Promise.all([
        supabase
          .from("agent_property_links")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", profile.id)
          .eq("status", "active"),
        supabase
          .from("guest_requests")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", profile.id)
          .in("status", ["new", "transferred_to_owner", "accepted_by_owner"]),
        supabase
          .from("guest_requests")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", profile.id)
          .eq("status", "completed"),
      ]);

    return {
      activeCollaborations: activeCollaborations ?? 0,
      incomingRequests: incomingRequests ?? 0,
      completedDeals: completedDeals ?? 0,
      publicLinkLabel: profile.slug ? `/a/${profile.slug}` : "Заполните slug в настройках",
    };
  } catch {
    return {
      activeCollaborations: 0,
      incomingRequests: 0,
      completedDeals: 0,
      publicLinkLabel: "Появится после подключения объектов",
    };
  }
}

export async function getAgentCollaborations(profile: AuthProfile): Promise<AgentCollaborationItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("agent_property_links")
      .select("id, status, collaboration_terms, properties(title), profiles!agent_property_links_owner_id_fkey(display_name)")
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false });

    return (data ?? []).map((item) => ({
      id: item.id as string,
      propertyTitle: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      ownerName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Владелец"),
      status: item.status === "active" ? "Активно" : item.status === "pending" ? "Ожидает" : "Завершено",
      terms: (item.collaboration_terms as string | null) ?? "Условия не указаны",
    }));
  } catch {
    return [];
  }
}
