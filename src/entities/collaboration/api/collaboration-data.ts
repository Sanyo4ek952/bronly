import type {
  AgentAvailablePropertyItem,
  AgentCollaborationItem,
  AgentDashboardSummary,
  AgentLinkStatus,
  AgentMarkupRoomItem,
  AgentProposalItem,
  OwnerIncomingAgentProposalItem,
} from "@/entities/collaboration/model/types";
import { createNotificationEvent } from "@/entities/notification";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile, type AuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseAgentPropertyLinkRow,
  SupabaseRoomAgentMarkupRow,
} from "@/shared/api/supabase/types";
import { formatDateTimeLabel } from "@/shared/lib/date";

type PropertyLookupRow = {
  id: string;
  owner_id: string;
  title: string;
  short_title: string;
  city: string;
  address: string;
  short_description: string | null;
  allow_agent_inquiries: boolean;
};

type CollaborationRoomRow = {
  id: string;
  property_id: string;
  title: string;
  subtitle: string | null;
  price_per_night: number;
};

function getFallbackSummary(profile: AuthProfile): AgentDashboardSummary {
  return {
    activeCollaborations: 0,
    incomingRequests: 0,
    completedDeals: 0,
    publicLinkLabel: profile.slug ? `/a/${profile.slug}` : "Заполните slug в настройках",
  };
}

function getStatusLabel(status: AgentLinkStatus) {
  switch (status) {
    case "active":
      return "Активно";
    case "pending":
      return "Ожидает";
    case "declined":
      return "Отклонено";
    default:
      return "Завершено";
  }
}

export async function getAgentDashboardSummary(profile: AuthProfile): Promise<AgentDashboardSummary> {
  if (!canUseSupabase()) {
    return getFallbackSummary(profile);
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
    return getFallbackSummary(profile);
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
      .select(
        "id, property_id, status, proposal_message, collaboration_terms, properties(title), profiles!agent_property_links_owner_id_fkey(display_name)",
      )
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false });

    const safeRows = (data ?? []) as Array<{
      id: string;
      property_id: string;
      status: AgentLinkStatus | null;
      proposal_message: string | null;
      collaboration_terms: string | null;
      properties: { title?: string } | null;
      profiles: { display_name?: string } | null;
    }>;
    const activePropertyIds = safeRows
      .filter((item) => item.status === "active")
      .map((item) => item.property_id);
    const roomRows = activePropertyIds.length
      ? (
          await supabase
            .from("rooms")
            .select("id, property_id, title, subtitle, price_per_night")
            .in("property_id", activePropertyIds)
            .eq("is_active", true)
            .order("title", { ascending: true })
        ).data ?? []
      : [];
    const roomIds = (roomRows as CollaborationRoomRow[]).map((room) => room.id);
    const markupRows = roomIds.length
      ? (
          await supabase
            .from("room_agent_markups")
            .select("*")
            .eq("agent_id", profile.id)
            .in("room_id", roomIds)
        ).data ?? []
      : [];
    const markupMap = new Map<string, number>();

    for (const item of markupRows as SupabaseRoomAgentMarkupRow[]) {
      markupMap.set(item.room_id, Number(item.markup_percent ?? 0));
    }

    const roomsByProperty = new Map<string, AgentMarkupRoomItem[]>();

    for (const room of roomRows as CollaborationRoomRow[]) {
      const basePricePerNight = Number(room.price_per_night ?? 0);
      const agentMarkupPercent = markupMap.get(room.id) ?? 0;
      const existing = roomsByProperty.get(room.property_id) ?? [];
      existing.push({
        id: room.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        basePricePerNight,
        agentMarkupPercent,
        agentPricePerNight: Number((basePricePerNight * (1 + agentMarkupPercent / 100)).toFixed(2)),
      });
      roomsByProperty.set(room.property_id, existing);
    }

    return safeRows.map((item) => ({
      id: item.id,
      propertyTitle: item.properties?.title ?? "Объект",
      ownerName: item.profiles?.display_name ?? "Владелец",
      status: item.status ?? "pending",
      statusLabel: getStatusLabel(item.status ?? "pending"),
      terms: item.collaboration_terms ?? item.proposal_message ?? "Сообщение не добавлено",
      propertyId: item.property_id,
      rooms: roomsByProperty.get(item.property_id) ?? [],
    }));
  } catch {
    return [];
  }
}

function normalizeMarkupPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

async function getAccessibleRoomForAgent(profileId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, property_id, properties!inner(owner_id)")
    .eq("id", roomId)
    .maybeSingle();
  const room = (data ?? null) as
    | {
        id: string;
        property_id: string;
        properties:
          | {
              owner_id: string;
            }
          | Array<{
              owner_id: string;
            }>
          | null;
      }
    | null;

  if (!room) {
    return null;
  }

  const property = Array.isArray(room.properties) ? (room.properties[0] ?? null) : room.properties;

  if (!property) {
    return null;
  }

  if (property.owner_id === profileId) {
    return room;
  }

  const { data: linkData } = await supabase
    .from("agent_property_links")
    .select("id")
    .eq("agent_id", profileId)
    .eq("property_id", room.property_id)
    .eq("status", "active")
    .maybeSingle();

  return linkData ? room : null;
}

export async function upsertAgentRoomMarkup(input: { roomId: string; markupPercent: number }) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !profile.roles.includes("agent")) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!input.roomId) {
    return { ok: false as const, reason: "validation" as const };
  }

  const accessibleRoom = await getAccessibleRoomForAgent(profile.id, input.roomId);

  if (!accessibleRoom) {
    return { ok: false as const, reason: "not_allowed" as const };
  }

  const markupPercent = normalizeMarkupPercent(input.markupPercent);
  const supabase = await createSupabaseServerClient();

  if (markupPercent === 0) {
    const { error } = await supabase
      .from("room_agent_markups")
      .delete()
      .eq("room_id", input.roomId)
      .eq("agent_id", profile.id);

    if (error) {
      return { ok: false as const, reason: "save_failed" as const };
    }

    return { ok: true as const };
  }

  const { error } = await supabase.from("room_agent_markups").upsert(
    {
      room_id: input.roomId,
      agent_id: profile.id,
      markup_percent: markupPercent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,agent_id" },
  );

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function getAgentAvailableProperties(profile: AuthProfile): Promise<AgentAvailablePropertyItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: candidateRows } = await supabase
      .from("properties")
      .select("id, owner_id, title, short_title, city, address, short_description, allow_agent_inquiries")
      .eq("allow_agent_inquiries", true)
      .neq("owner_id", profile.id)
      .order("created_at", { ascending: false });

    const safeCandidates = (candidateRows ?? []) as PropertyLookupRow[];

    if (!safeCandidates.length) {
      return [];
    }

    const propertyIds = safeCandidates.map((property) => property.id);
    const ownerIds = [...new Set(safeCandidates.map((property) => property.owner_id))];
    const [{ data: linkRows }, { data: ownerRows }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select("property_id, status")
        .eq("agent_id", profile.id)
        .in("property_id", propertyIds),
      supabase.from("profiles").select("id, display_name").in("id", ownerIds),
    ]);

    const blockedPropertyIds = new Set(
      ((linkRows ?? []) as Array<{ property_id: string; status: AgentLinkStatus }>).flatMap((row) =>
        row.status === "pending" || row.status === "active" ? [row.property_id] : [],
      ),
    );
    const ownerNameMap = new Map(
      (ownerRows ?? []).map((row) => [row.id as string, (row.display_name as string | null) ?? "Владелец"]),
    );

    return safeCandidates
      .filter((property) => !blockedPropertyIds.has(property.id))
      .map((property) => ({
        propertyId: property.id,
        propertyTitle: property.title,
        shortTitle: property.short_title,
        city: property.city,
        address: property.address,
        ownerName: ownerNameMap.get(property.owner_id) ?? "Владелец",
        shortDescription: property.short_description ?? "",
      }));
  } catch {
    return [];
  }
}

export async function getAgentOutgoingProposals(profile: AuthProfile): Promise<AgentProposalItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("agent_property_links")
      .select("id, status, proposal_message, proposed_at, properties(title), profiles!agent_property_links_owner_id_fkey(display_name)")
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false });

    return (data ?? []).map((item) => ({
      id: item.id as string,
      propertyTitle: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      ownerName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Владелец"),
      message: (item.proposal_message as string | null) ?? "",
      status: ((item.status as AgentLinkStatus | null) ?? "pending"),
      statusLabel: getStatusLabel((item.status as AgentLinkStatus | null) ?? "pending"),
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function getOwnerIncomingAgentProposals(): Promise<OwnerIncomingAgentProposalItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("agent_property_links")
      .select("id, proposal_message, proposed_at, properties(title), profiles!agent_property_links_agent_id_fkey(display_name)")
      .eq("owner_id", profile.id)
      .eq("status", "pending")
      .order("proposed_at", { ascending: false });

    return (data ?? []).map((item) => ({
      id: item.id as string,
      propertyTitle: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      agentName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Агент"),
      message: (item.proposal_message as string | null) ?? "",
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function submitAgentProposal(input: { propertyId: string; message: string }) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!input.propertyId) {
    return { ok: false as const, reason: "validation" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: propertyData } = await supabase
      .from("properties")
      .select("id, owner_id, title, allow_agent_inquiries")
      .eq("id", input.propertyId)
      .maybeSingle();

    const property = propertyData as Pick<PropertyLookupRow, "id" | "owner_id" | "title" | "allow_agent_inquiries"> | null;

    if (!property || !property.allow_agent_inquiries || property.owner_id === profile.id) {
      return { ok: false as const, reason: "not_available" as const };
    }

    const { data: existingData } = await supabase
      .from("agent_property_links")
      .select("*")
      .eq("property_id", property.id)
      .eq("agent_id", profile.id)
      .maybeSingle();
    const existing = existingData as SupabaseAgentPropertyLinkRow | null;

    if (existing?.status === "pending" || existing?.status === "active") {
      return { ok: false as const, reason: "duplicate" as const };
    }

    const payload = {
      property_id: property.id,
      owner_id: property.owner_id,
      agent_id: profile.id,
      status: "pending",
      proposal_message: input.message.trim() || null,
      proposed_at: new Date().toISOString(),
      decided_at: null,
      owner_contact_visible: false,
    };

    const { error } = existing
      ? await supabase.from("agent_property_links").update(payload).eq("id", existing.id)
      : await supabase.from("agent_property_links").insert(payload);

    if (error) {
      return { ok: false as const, reason: "save_failed" as const };
    }

    await createNotificationEvent({
      recipientId: property.owner_id,
      eventType: "agent_proposal_received",
      payload: {
        propertyId: property.id,
        propertyTitle: property.title,
        linkPath: "/dashboard/agent-proposals",
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}

export async function reviewAgentProposal(input: { proposalId: string; decision: "active" | "declined" }) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !input.proposalId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: proposalData } = await supabase
      .from("agent_property_links")
      .select("*")
      .eq("id", input.proposalId)
      .maybeSingle();
    const proposal = proposalData as SupabaseAgentPropertyLinkRow | null;

    if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
      return { ok: false as const, reason: "not_found" as const };
    }

    let ownerContactVisible = false;

    if (input.decision === "active") {
      const { data: propertyData } = await supabase
        .from("properties")
        .select("allow_owner_contact_sharing")
        .eq("id", proposal.property_id)
        .maybeSingle();

      ownerContactVisible = Boolean(propertyData?.allow_owner_contact_sharing);
    }

    const { error } = await supabase
      .from("agent_property_links")
      .update({
        status: input.decision,
        decided_at: new Date().toISOString(),
        owner_contact_visible: ownerContactVisible,
        collaboration_terms: proposal.collaboration_terms ?? proposal.proposal_message,
      })
      .eq("id", proposal.id);

    if (error) {
      return { ok: false as const, reason: "save_failed" as const };
    }

    const { data: propertyDetails } = await supabase
      .from("properties")
      .select("title")
      .eq("id", proposal.property_id)
      .maybeSingle();

    await createNotificationEvent({
      recipientId: proposal.agent_id,
      eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
      payload: {
        proposalId: proposal.id,
        propertyId: proposal.property_id,
        propertyTitle: (propertyDetails?.title as string | null) ?? undefined,
        linkPath: input.decision === "active" ? "/agent/dashboard/collaborations" : "/agent/dashboard/opportunities",
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}
