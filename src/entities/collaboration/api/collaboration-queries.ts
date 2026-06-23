import type {
  AgentAvailablePropertyItem,
  AgentCalendarBusyRange,
  AgentCalendarPropertyItem,
  AgentCollaborationItem,
  AgentDashboardSummary,
  AgentProposalItem,
  OwnerActiveCollaborationItem,
  OwnerIncomingAgentProposalItem,
} from "@/entities/collaboration/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile, type AuthProfile } from "@/shared/api/supabase/server-auth";
import type { SupabaseRoomAgentMarkupRow } from "@/shared/api/supabase/types";
import { buildAgentPublicPath } from "@/shared/lib/public-links";

import { getActiveAgentPropertyIds, getActiveAgentRoomIds } from "./collaboration-access";
import { getFallbackSummary } from "./collaboration-formatters";
import {
  buildMarkupRoomsLookup,
  mapAgentAvailablePropertyItems,
  mapAgentCalendarItems,
  mapAgentCollaborationItems,
  mapAgentProposalItems,
  mapOwnerActiveCollaborations,
  mapOwnerIncomingProposalItems,
} from "./collaboration-mappers";
import type { AgentPropertyLinkListRow, AgentRoomLinkListRow, CollaborationRoomRow, ProfileContactRow, PropertyLookupRow } from "./collaboration-types";

export async function getAgentDashboardSummary(profile: AuthProfile): Promise<AgentDashboardSummary> {
  if (!canUseSupabase()) {
    return getFallbackSummary(profile);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [
      { count: activePropertyCollaborations },
      { count: activeRoomCollaborations },
      { count: incomingRequests },
      { count: completedDeals },
    ] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", profile.id)
        .eq("status", "active"),
      supabase
        .from("agent_room_links")
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
      activeCollaborations: (activePropertyCollaborations ?? 0) + (activeRoomCollaborations ?? 0),
      incomingRequests: incomingRequests ?? 0,
      completedDeals: completedDeals ?? 0,
      publicLinkLabel: buildAgentPublicPath(profile.agentPublicId) ?? "",
      publicLinkHref: buildAgentPublicPath(profile.agentPublicId),
    };
  } catch {
    return getFallbackSummary(profile);
  }
}

async function buildAgentCollaborationItems(
  profile: AuthProfile,
  options?: { status?: "active" },
): Promise<AgentCollaborationItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  const statusFilter = options?.status;

  try {
    const supabase = createSupabaseAdminClient();
    const propertyQuery = supabase
      .from("agent_property_links")
      .select(
        "id, property_id, status, proposal_message, collaboration_terms, owner_contact_visible, properties(title), profiles!agent_property_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
      )
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false });
    const roomQuery = supabase
      .from("agent_room_links")
      .select(
        "id, room_id, status, proposal_message, collaboration_terms, owner_contact_visible, rooms(title, subtitle, price_per_night), profiles!agent_room_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
      )
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false });

    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      statusFilter ? propertyQuery.eq("status", statusFilter) : propertyQuery,
      statusFilter ? roomQuery.eq("status", statusFilter) : roomQuery,
    ]);

    const safePropertyLinks = (propertyLinks ?? []) as AgentPropertyLinkListRow[];
    const safeRoomLinks = (roomLinks ?? []) as AgentRoomLinkListRow[];
    const activePropertyIds = statusFilter === "active"
      ? safePropertyLinks.map((item) => item.property_id)
      : safePropertyLinks.filter((item) => item.status === "active").map((item) => item.property_id);
    const activeStandaloneRoomIds = statusFilter === "active"
      ? safeRoomLinks.map((item) => item.room_id)
      : safeRoomLinks.filter((item) => item.status === "active").map((item) => item.room_id);

    const [propertyRoomRows, standaloneRoomRows] = await Promise.all([
      activePropertyIds.length
        ? (
            await supabase
              .from("rooms")
              .select("id, property_id, title, subtitle, price_per_night")
              .in("property_id", activePropertyIds)
              .eq("is_active", true)
              .order("title", { ascending: true })
          ).data ?? []
        : [],
      activeStandaloneRoomIds.length
        ? (
            await supabase
              .from("rooms")
              .select("id, property_id, title, subtitle, price_per_night")
              .in("id", activeStandaloneRoomIds)
              .eq("is_active", true)
              .order("title", { ascending: true })
          ).data ?? []
        : [],
    ]);

    const allRoomRows = [...(propertyRoomRows as CollaborationRoomRow[]), ...(standaloneRoomRows as CollaborationRoomRow[])];
    const roomIds = allRoomRows.map((room) => room.id);
    const markupRows = roomIds.length
      ? (
          await supabase
            .from("room_agent_markups")
            .select("*")
            .eq("agent_id", profile.id)
            .in("room_id", roomIds)
        ).data ?? []
      : [];
    const { roomsByProperty, standaloneRoomMap } = buildMarkupRoomsLookup(
      allRoomRows,
      markupRows as SupabaseRoomAgentMarkupRow[],
    );

    return mapAgentCollaborationItems({
      propertyLinks: safePropertyLinks,
      roomLinks: safeRoomLinks,
      roomsByProperty,
      standaloneRoomMap,
      defaultStatus: statusFilter ?? "pending",
    });
  } catch {
    return [];
  }
}

export async function getAgentCollaborations(profile: AuthProfile): Promise<AgentCollaborationItem[]> {
  return buildAgentCollaborationItems(profile);
}

export async function getAgentActiveCollaborations(profile: AuthProfile): Promise<AgentCollaborationItem[]> {
  return buildAgentCollaborationItems(profile, { status: "active" });
}

export async function getAgentCalendarData(profile: AuthProfile): Promise<AgentCalendarPropertyItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [propertyIds, standaloneRoomIds] = await Promise.all([
      getActiveAgentPropertyIds(profile.id),
      getActiveAgentRoomIds(profile.id),
    ]);

    const [{ data: propertyRows }, { data: propertyRoomRows }, { data: standaloneRoomRows }] = await Promise.all([
      propertyIds.length
        ? supabase.from("properties").select("id, title, city, address").in("id", propertyIds).order("title", { ascending: true })
        : Promise.resolve({ data: [] }),
      propertyIds.length
        ? supabase
            .from("rooms")
            .select("id, property_id, title, subtitle")
            .in("property_id", propertyIds)
            .eq("is_active", true)
            .order("title", { ascending: true })
        : Promise.resolve({ data: [] }),
      standaloneRoomIds.length
        ? supabase
            .from("rooms")
            .select("id, property_id, title, subtitle, property_type, city, address")
            .in("id", standaloneRoomIds)
            .eq("is_active", true)
            .order("title", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

    const safePropertyRows = (propertyRows ?? []) as Array<{
      id: string;
      title: string;
      city: string;
      address: string;
    }>;
    const safePropertyRoomRows = (propertyRoomRows ?? []) as Array<{
      id: string;
      property_id: string;
      title: string;
      subtitle: string | null;
    }>;
    const safeStandaloneRoomRows = (standaloneRoomRows ?? []) as Array<{
      id: string;
      title: string;
      subtitle: string | null;
      property_type: string | null;
      city: string | null;
      address: string | null;
    }>;

    const roomIds = [...safePropertyRoomRows.map((room) => room.id), ...safeStandaloneRoomRows.map((room) => room.id)];
    const { data: busyRows } = roomIds.length
      ? await supabase.from("room_busy_ranges").select("id, room_id, starts_on, ends_on, label, note").in("room_id", roomIds)
      : { data: [] };
    const busyMap = new Map<string, AgentCalendarBusyRange[]>();

    for (const item of (busyRows ?? []) as Array<{
      id: string;
      room_id: string;
      starts_on: string;
      ends_on: string;
      label: string | null;
      note: string | null;
    }>) {
      const existing = busyMap.get(item.room_id) ?? [];
      existing.push({
        id: item.id,
        startsOn: item.starts_on,
        endsOn: item.ends_on,
        label: item.label ?? "",
        note: item.note ?? "",
      });
      busyMap.set(item.room_id, existing);
    }

    return mapAgentCalendarItems({
      properties: safePropertyRows,
      propertyRooms: safePropertyRoomRows,
      standaloneRooms: safeStandaloneRoomRows,
      busyMap,
    });
  } catch {
    return [];
  }
}

export async function getAgentAvailableProperties(profile: AuthProfile): Promise<AgentAvailablePropertyItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: candidateProperties }, { data: candidateRooms }] = await Promise.all([
      supabase
        .from("properties")
        .select("id, owner_id, title, short_title, city, address, short_description, allow_agent_inquiries")
        .eq("allow_agent_inquiries", true)
        .neq("owner_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("rooms")
        .select("id, owner_id, property_id, room_kind, title, subtitle, property_type, city, address, short_description, allow_agent_inquiries")
        .eq("room_kind", "standalone_room")
        .eq("allow_agent_inquiries", true)
        .neq("owner_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

    const safeCandidates = (candidateProperties ?? []) as PropertyLookupRow[];
    const safeStandaloneRooms = (candidateRooms ?? []) as Array<{
      id: string;
      owner_id: string;
      title: string;
      subtitle: string | null;
      property_type: string | null;
      city: string | null;
      address: string | null;
      short_description: string | null;
    }>;

    const propertyIds = safeCandidates.map((property) => property.id);
    const roomIds = safeStandaloneRooms.map((room) => room.id);
    const ownerIds = [...new Set([...safeCandidates.map((property) => property.owner_id), ...safeStandaloneRooms.map((room) => room.owner_id)])];
    const [{ data: propertyLinks }, { data: roomLinks }, { data: ownerRows }] = await Promise.all([
      propertyIds.length
        ? supabase.from("agent_property_links").select("property_id, status").eq("agent_id", profile.id).in("property_id", propertyIds)
        : Promise.resolve({ data: [] }),
      roomIds.length
        ? supabase.from("agent_room_links").select("room_id, status").eq("agent_id", profile.id).in("room_id", roomIds)
        : Promise.resolve({ data: [] }),
      ownerIds.length ? supabase.from("profiles").select("id, display_name").in("id", ownerIds) : Promise.resolve({ data: [] }),
    ]);

    const blockedPropertyIds = new Set(
      ((propertyLinks ?? []) as Array<{ property_id: string; status: "pending" | "active" | "declined" | "ended" }>).flatMap((row) =>
        row.status === "pending" || row.status === "active" ? [row.property_id] : [],
      ),
    );
    const blockedRoomIds = new Set(
      ((roomLinks ?? []) as Array<{ room_id: string; status: "pending" | "active" | "declined" | "ended" }>).flatMap((row) =>
        row.status === "pending" || row.status === "active" ? [row.room_id] : [],
      ),
    );
    const ownerNameMap = new Map(
      (ownerRows ?? []).map((row) => [row.id as string, (row.display_name as string | null) ?? "Владелец"]),
    );

    return mapAgentAvailablePropertyItems({
      properties: safeCandidates,
      standaloneRooms: safeStandaloneRooms,
      blockedPropertyIds,
      blockedRoomIds,
      ownerNameMap,
    });
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
    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select("id, status, proposal_message, proposed_at, properties(title), profiles!agent_property_links_owner_id_fkey(display_name)")
        .eq("agent_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("agent_room_links")
        .select("id, status, proposal_message, proposed_at, rooms(title), profiles!agent_room_links_owner_id_fkey(display_name)")
        .eq("agent_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

    return mapAgentProposalItems({
      propertyLinks: (propertyLinks ?? []) as Array<{ id: string; status?: string | null; proposal_message?: string | null; proposed_at?: string | null; properties?: { title?: string } | null; profiles?: { display_name?: string } | null }>,
      roomLinks: (roomLinks ?? []) as Array<{ id: string; status?: string | null; proposal_message?: string | null; proposed_at?: string | null; rooms?: { title?: string } | null; profiles?: { display_name?: string } | null }>,
    });
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
    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select("id, proposal_message, proposed_at, properties(title), profiles!agent_property_links_agent_id_fkey(display_name)")
        .eq("owner_id", profile.id)
        .eq("status", "pending")
        .order("proposed_at", { ascending: false }),
      supabase
        .from("agent_room_links")
        .select("id, proposal_message, proposed_at, rooms(title), profiles!agent_room_links_agent_id_fkey(display_name)")
        .eq("owner_id", profile.id)
        .eq("status", "pending")
        .order("proposed_at", { ascending: false }),
    ]);

    return mapOwnerIncomingProposalItems({
      propertyLinks: (propertyLinks ?? []) as Array<{ id: string; proposal_message?: string | null; proposed_at?: string | null; properties?: { title?: string } | null; profiles?: { display_name?: string } | null }>,
      roomLinks: (roomLinks ?? []) as Array<{ id: string; proposal_message?: string | null; proposed_at?: string | null; rooms?: { title?: string } | null; profiles?: { display_name?: string } | null }>,
    });
  } catch {
    return [];
  }
}

export async function getOwnerActiveCollaborations(): Promise<OwnerActiveCollaborationItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select(
          "agent_id, proposal_message, collaboration_terms, properties(id, title), profiles!agent_property_links_agent_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("owner_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("agent_room_links")
        .select(
          "agent_id, proposal_message, collaboration_terms, rooms(id, title), profiles!agent_room_links_agent_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("owner_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    return mapOwnerActiveCollaborations({
      propertyLinks: (propertyLinks ?? []) as Array<{
        agent_id: string;
        proposal_message: string | null;
        collaboration_terms: string | null;
        properties: { id?: string; title?: string } | null;
        profiles: ProfileContactRow | null;
      }>,
      roomLinks: (roomLinks ?? []) as Array<{
        agent_id: string;
        proposal_message: string | null;
        collaboration_terms: string | null;
        rooms: { id?: string; title?: string } | null;
        profiles: ProfileContactRow | null;
      }>,
    });
  } catch {
    return [];
  }
}
