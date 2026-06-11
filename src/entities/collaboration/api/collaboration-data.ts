import type {
  AgentAvailablePropertyItem,
  AgentCalendarBusyRange,
  AgentCalendarPropertyItem,
  AgentCalendarRoomItem,
  AgentCollaborationItem,
  AgentCollaborationTargetType,
  CollaborationContact,
  CollaborationTargetSummary,
  AgentDashboardSummary,
  AgentLinkStatus,
  AgentMarkupRoomItem,
  AgentProposalItem,
  OwnerActiveCollaborationItem,
  OwnerIncomingAgentProposalItem,
} from "@/entities/collaboration/model/types";
import { createNotificationEvent } from "@/entities/notification";
import { markAgentReferralMilestone } from "@/entities/referral";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile, type AuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseAgentPropertyLinkRow,
  SupabaseAgentRoomLinkRow,
  SupabaseRoomAgentMarkupRow,
} from "@/shared/api/supabase/types";
import { formatDateTimeLabel } from "@/shared/lib/date";
import { buildAgentPublicPath } from "@/shared/lib/public-links";

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

type RoomLookupRow = {
  id: string;
  owner_id: string;
  property_id: string | null;
  room_kind: "property_room" | "standalone_room";
  title: string;
  subtitle: string | null;
  property_type: string | null;
  city: string | null;
  address: string | null;
  short_description: string | null;
  allow_agent_inquiries: boolean;
  price_per_night: number;
  properties:
    | {
        id: string;
        owner_id: string;
        title: string;
        city: string;
        address: string;
      }
    | Array<{
        id: string;
        owner_id: string;
        title: string;
        city: string;
        address: string;
      }>
    | null;
};

type CollaborationRoomRow = {
  id: string;
  property_id: string | null;
  title: string;
  subtitle: string | null;
  price_per_night: number;
};

type UnifiedProposalTarget = {
  linkId: string;
  targetType: AgentCollaborationTargetType;
  targetId: string;
  ownerId: string;
  title: string;
  subtitle: string;
  description: string;
};

type ProfileContactRow = {
  display_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
};

function getFallbackSummary(profile: AuthProfile): AgentDashboardSummary {
  const publicLinkHref = buildAgentPublicPath(profile.agentPublicId);

  return {
    activeCollaborations: 0,
    incomingRequests: 0,
    completedDeals: 0,
    publicLinkLabel: publicLinkHref ?? "",
    publicLinkHref,
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

function getContact(input?: ProfileContactRow | null): CollaborationContact {
  return {
    phone: input?.phone ?? "",
    whatsapp: input?.whatsapp ?? "",
    telegram: input?.telegram ?? "",
  };
}

function getCollaborationTerms(terms: string | null, message: string | null) {
  return terms ?? message ?? "Сообщение не добавлено";
}

function buildCollaborationTarget(
  id: string,
  targetType: AgentCollaborationTargetType,
  targetTitle: string,
): CollaborationTargetSummary {
  return {
    id,
    targetType,
    targetTitle,
  };
}

function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeMarkupPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function mapStandaloneRoomLocation(room: RoomLookupRow) {
  return [room.property_type ?? "Отдельный номер", room.city ?? "", room.address ?? ""].filter(Boolean).join(" • ");
}

async function getActiveAgentPropertyIds(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_property_links")
    .select("property_id")
    .eq("agent_id", profileId)
    .eq("status", "active");

  return Array.from(new Set((data ?? []).map((row) => row.property_id as string)));
}

async function getActiveAgentRoomIds(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_room_links")
    .select("room_id")
    .eq("agent_id", profileId)
    .eq("status", "active");

  return Array.from(new Set((data ?? []).map((row) => row.room_id as string)));
}

async function hasActivePropertyCollaboration(profileId: string, propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_property_links")
    .select("id")
    .eq("agent_id", profileId)
    .eq("property_id", propertyId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

async function hasActiveRoomCollaboration(profileId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_room_links")
    .select("id")
    .eq("agent_id", profileId)
    .eq("room_id", roomId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

async function getAccessibleRoomForAgent(profileId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, owner_id, property_id, room_kind, properties(id, owner_id)")
    .eq("id", roomId)
    .maybeSingle();
  const room = (data ?? null) as
    | {
        id: string;
        owner_id: string;
        property_id: string | null;
        room_kind: "property_room" | "standalone_room";
        properties:
          | {
              id: string;
              owner_id: string;
            }
          | Array<{
              id: string;
              owner_id: string;
            }>
          | null;
      }
    | null;

  if (!room) {
    return null;
  }

  if (room.owner_id === profileId) {
    return room;
  }

  const property = getSingleRow(room.properties);

  if (room.property_id && property) {
    return (await hasActivePropertyCollaboration(profileId, room.property_id)) ? room : null;
  }

  return (await hasActiveRoomCollaboration(profileId, room.id)) ? room : null;
}

async function resolveProposalTarget(input: {
  profileId: string;
  targetType: AgentCollaborationTargetType;
  propertyId?: string;
  roomId?: string;
}): Promise<UnifiedProposalTarget | null> {
  const supabase = createSupabaseAdminClient();

  if (input.targetType === "property") {
    if (!input.propertyId) {
      return null;
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("id, owner_id, title, city, address, short_description, allow_agent_inquiries")
      .eq("id", input.propertyId)
      .maybeSingle();
    const property = propertyData as PropertyLookupRow | null;

    if (!property || !property.allow_agent_inquiries || property.owner_id === input.profileId) {
      return null;
    }

    return {
      linkId: property.id,
      targetType: "property",
      targetId: property.id,
      ownerId: property.owner_id,
      title: property.title,
      subtitle: [property.city, property.address].filter(Boolean).join(", "),
      description: property.short_description ?? "",
    };
  }

  if (!input.roomId) {
    return null;
  }

  const { data: roomData } = await supabase
    .from("rooms")
    .select(
      "id, owner_id, property_id, room_kind, title, subtitle, property_type, city, address, short_description, allow_agent_inquiries, properties(id, owner_id, title, city, address)",
    )
    .eq("id", input.roomId)
    .eq("room_kind", "standalone_room")
    .maybeSingle();
  const room = (roomData ?? null) as RoomLookupRow | null;

  if (!room || !room.allow_agent_inquiries || room.owner_id === input.profileId) {
    return null;
  }

  return {
    linkId: room.id,
    targetType: "standalone_room",
    targetId: room.id,
    ownerId: room.owner_id,
    title: room.title,
    subtitle: mapStandaloneRoomLocation(room),
    description: room.short_description ?? room.subtitle ?? "",
  };
}

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

export async function getAgentCollaborations(profile: AuthProfile): Promise<AgentCollaborationItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select(
          "id, property_id, status, proposal_message, collaboration_terms, owner_contact_visible, properties(title), profiles!agent_property_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("agent_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("agent_room_links")
        .select(
          "id, room_id, status, proposal_message, collaboration_terms, owner_contact_visible, rooms(title, subtitle, price_per_night), profiles!agent_room_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("agent_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

    const safePropertyLinks = (propertyLinks ?? []) as Array<{
      id: string;
      property_id: string;
      status: AgentLinkStatus | null;
      proposal_message: string | null;
      collaboration_terms: string | null;
      owner_contact_visible: boolean | null;
      properties: { title?: string } | null;
      profiles: ProfileContactRow | null;
    }>;
    const safeRoomLinks = (roomLinks ?? []) as Array<{
      id: string;
      room_id: string;
      status: AgentLinkStatus | null;
      proposal_message: string | null;
      collaboration_terms: string | null;
      owner_contact_visible: boolean | null;
      rooms: { title?: string; subtitle?: string | null; price_per_night?: number } | null;
      profiles: ProfileContactRow | null;
    }>;

    const activePropertyIds = safePropertyLinks.filter((item) => item.status === "active").map((item) => item.property_id);
    const activeStandaloneRoomIds = safeRoomLinks.filter((item) => item.status === "active").map((item) => item.room_id);

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
    const markupMap = new Map<string, number>();

    for (const item of markupRows as SupabaseRoomAgentMarkupRow[]) {
      markupMap.set(item.room_id, Number(item.markup_percent ?? 0));
    }

    const roomsByProperty = new Map<string, AgentMarkupRoomItem[]>();
    const standaloneRoomMap = new Map<string, AgentMarkupRoomItem>();

    for (const room of allRoomRows) {
      const basePricePerNight = Number(room.price_per_night ?? 0);
      const agentMarkupPercent = markupMap.get(room.id) ?? 0;
      const mappedRoom = {
        id: room.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        basePricePerNight,
        agentMarkupPercent,
        agentPricePerNight: Number((basePricePerNight * (1 + agentMarkupPercent / 100)).toFixed(2)),
      };

      if (room.property_id) {
        const existing = roomsByProperty.get(room.property_id) ?? [];
        existing.push(mappedRoom);
        roomsByProperty.set(room.property_id, existing);
      } else {
        standaloneRoomMap.set(room.id, mappedRoom);
      }
    }

    const propertyItems: AgentCollaborationItem[] = safePropertyLinks.map((item) => ({
      id: item.id,
      targetType: "property",
      targetId: item.property_id,
      title: item.properties?.title ?? "Объект",
      subtitle: "Объект владельца",
      ownerName: item.profiles?.display_name ?? "Владелец",
      status: item.status ?? "pending",
      statusLabel: getStatusLabel(item.status ?? "pending"),
      ownerContact: getContact(item.profiles),
      ownerContactVisible: Boolean(item.owner_contact_visible),
      terms: item.collaboration_terms ?? item.proposal_message ?? "Сообщение не добавлено",
      rooms: roomsByProperty.get(item.property_id) ?? [],
      targets: [buildCollaborationTarget(item.property_id, "property", item.properties?.title ?? "Объект")],
    }));
    const roomItems: AgentCollaborationItem[] = safeRoomLinks.map((item) => ({
      id: item.id,
      targetType: "standalone_room",
      targetId: item.room_id,
      title: item.rooms?.title ?? "Отдельный номер",
      subtitle: item.rooms?.subtitle ?? "Самостоятельный вариант размещения",
      ownerName: item.profiles?.display_name ?? "Владелец",
      status: item.status ?? "pending",
      statusLabel: getStatusLabel(item.status ?? "pending"),
      ownerContact: getContact(item.profiles),
      ownerContactVisible: Boolean(item.owner_contact_visible),
      terms: item.collaboration_terms ?? item.proposal_message ?? "Сообщение не добавлено",
      rooms: standaloneRoomMap.has(item.room_id) ? [standaloneRoomMap.get(item.room_id)!] : [],
      targets: [buildCollaborationTarget(item.room_id, "standalone_room", item.rooms?.title ?? "Отдельный номер")],
    }));

    return [...propertyItems, ...roomItems];
  } catch {
    return [];
  }
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

    const roomsByProperty = new Map<string, AgentCalendarRoomItem[]>();

    for (const room of safePropertyRoomRows) {
      const existing = roomsByProperty.get(room.property_id) ?? [];
      existing.push({
        id: room.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        busyRanges: (busyMap.get(room.id) ?? []).sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
      });
      roomsByProperty.set(room.property_id, existing);
    }

    const propertyItems: AgentCalendarPropertyItem[] = safePropertyRows
      .map((property) => ({
        id: property.id,
        targetType: "property" as const,
        title: property.title,
        subtitle: [property.city, property.address].filter(Boolean).join(", "),
        rooms: roomsByProperty.get(property.id) ?? [],
      }))
      .filter((item) => item.rooms.length > 0);
    const standaloneItems: AgentCalendarPropertyItem[] = safeStandaloneRoomRows.map((room) => ({
      id: room.id,
      targetType: "standalone_room" as const,
      title: room.title,
      subtitle: [room.property_type ?? "Отдельный номер", room.city ?? "", room.address ?? ""].filter(Boolean).join(" • "),
      rooms: [
        {
          id: room.id,
          title: room.title,
          subtitle: room.subtitle ?? "",
          busyRanges: (busyMap.get(room.id) ?? []).sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
        },
      ],
    }));

    return [...propertyItems, ...standaloneItems];
  } catch {
    return [];
  }
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
      ((propertyLinks ?? []) as Array<{ property_id: string; status: AgentLinkStatus }>).flatMap((row) =>
        row.status === "pending" || row.status === "active" ? [row.property_id] : [],
      ),
    );
    const blockedRoomIds = new Set(
      ((roomLinks ?? []) as Array<{ room_id: string; status: AgentLinkStatus }>).flatMap((row) =>
        row.status === "pending" || row.status === "active" ? [row.room_id] : [],
      ),
    );
    const ownerNameMap = new Map(
      (ownerRows ?? []).map((row) => [row.id as string, (row.display_name as string | null) ?? "Владелец"]),
    );

    const propertyItems: AgentAvailablePropertyItem[] = safeCandidates
      .filter((property) => !blockedPropertyIds.has(property.id))
      .map((property) => ({
        targetType: "property",
        propertyId: property.id,
        roomId: null,
        title: property.title,
        shortTitle: property.short_title,
        city: property.city,
        address: property.address,
        ownerName: ownerNameMap.get(property.owner_id) ?? "Владелец",
        shortDescription: property.short_description ?? "",
      }));
    const roomItems: AgentAvailablePropertyItem[] = safeStandaloneRooms
      .filter((room) => !blockedRoomIds.has(room.id))
      .map((room) => ({
        targetType: "standalone_room",
        propertyId: null,
        roomId: room.id,
        title: room.title,
        shortTitle: room.title,
        city: room.city ?? "",
        address: room.address ?? "",
        ownerName: ownerNameMap.get(room.owner_id) ?? "Владелец",
        shortDescription: room.short_description ?? room.subtitle ?? room.property_type ?? "",
      }));

    return [...propertyItems, ...roomItems];
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

    const propertyItems = (propertyLinks ?? []).map((item) => ({
      id: item.id as string,
      targetType: "property" as const,
      title: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      ownerName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Владелец"),
      message: (item.proposal_message as string | null) ?? "",
      status: ((item.status as AgentLinkStatus | null) ?? "pending"),
      statusLabel: getStatusLabel((item.status as AgentLinkStatus | null) ?? "pending"),
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));
    const roomItems = (roomLinks ?? []).map((item) => ({
      id: item.id as string,
      targetType: "standalone_room" as const,
      title: ((item.rooms as { title?: string } | null)?.title ?? "Отдельный номер"),
      ownerName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Владелец"),
      message: (item.proposal_message as string | null) ?? "",
      status: ((item.status as AgentLinkStatus | null) ?? "pending"),
      statusLabel: getStatusLabel((item.status as AgentLinkStatus | null) ?? "pending"),
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));

    return [...propertyItems, ...roomItems];
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

    const propertyItems = (propertyLinks ?? []).map((item) => ({
      id: item.id as string,
      targetType: "property" as const,
      title: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      agentName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Агент"),
      message: (item.proposal_message as string | null) ?? "",
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));
    const roomItems = (roomLinks ?? []).map((item) => ({
      id: item.id as string,
      targetType: "standalone_room" as const,
      title: ((item.rooms as { title?: string } | null)?.title ?? "Отдельный номер"),
      agentName: ((item.profiles as { display_name?: string } | null)?.display_name ?? "Агент"),
      message: (item.proposal_message as string | null) ?? "",
      createdAt: formatDateTimeLabel((item.proposed_at as string | null) ?? new Date().toISOString()),
    }));

    return [...propertyItems, ...roomItems];
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

    const grouped = new Map<string, OwnerActiveCollaborationItem>();

    for (const item of (propertyLinks ?? []) as Array<{
      agent_id: string;
      proposal_message: string | null;
      collaboration_terms: string | null;
      properties: { id?: string; title?: string } | null;
      profiles: ProfileContactRow | null;
    }>) {
      const existing = grouped.get(item.agent_id) ?? {
        agentId: item.agent_id,
        agentName: item.profiles?.display_name ?? "Агент",
        agentContact: getContact(item.profiles),
        terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),
        targets: [],
      };

      if (item.properties?.id) {
        existing.targets.push(buildCollaborationTarget(item.properties.id, "property", item.properties.title ?? "Объект"));
      }

      grouped.set(item.agent_id, existing);
    }

    for (const item of (roomLinks ?? []) as Array<{
      agent_id: string;
      proposal_message: string | null;
      collaboration_terms: string | null;
      rooms: { id?: string; title?: string } | null;
      profiles: ProfileContactRow | null;
    }>) {
      const existing = grouped.get(item.agent_id) ?? {
        agentId: item.agent_id,
        agentName: item.profiles?.display_name ?? "Агент",
        agentContact: getContact(item.profiles),
        terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),
        targets: [],
      };

      if (item.rooms?.id) {
        existing.targets.push(buildCollaborationTarget(item.rooms.id, "standalone_room", item.rooms.title ?? "Отдельный номер"));
      }

      grouped.set(item.agent_id, existing);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      targets: item.targets.filter(
        (target, index, array) => array.findIndex((candidate) => candidate.id === target.id && candidate.targetType === target.targetType) === index,
      ),
    }));
  } catch {
    return [];
  }
}

export async function getAgentActiveCollaborations(profile: AuthProfile): Promise<AgentCollaborationItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: propertyLinks }, { data: roomLinks }] = await Promise.all([
      supabase
        .from("agent_property_links")
        .select(
          "id, property_id, status, proposal_message, collaboration_terms, owner_contact_visible, properties(title), profiles!agent_property_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("agent_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("agent_room_links")
        .select(
          "id, room_id, status, proposal_message, collaboration_terms, owner_contact_visible, rooms(title, subtitle, price_per_night), profiles!agent_room_links_owner_id_fkey(display_name, phone, whatsapp, telegram)",
        )
        .eq("agent_id", profile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    const safePropertyLinks = (propertyLinks ?? []) as Array<{
      id: string;
      property_id: string;
      status: AgentLinkStatus | null;
      proposal_message: string | null;
      collaboration_terms: string | null;
      owner_contact_visible: boolean | null;
      properties: { title?: string } | null;
      profiles: ProfileContactRow | null;
    }>;
    const safeRoomLinks = (roomLinks ?? []) as Array<{
      id: string;
      room_id: string;
      status: AgentLinkStatus | null;
      proposal_message: string | null;
      collaboration_terms: string | null;
      owner_contact_visible: boolean | null;
      rooms: { title?: string; subtitle?: string | null; price_per_night?: number } | null;
      profiles: ProfileContactRow | null;
    }>;

    const activePropertyIds = safePropertyLinks.map((item) => item.property_id);
    const activeStandaloneRoomIds = safeRoomLinks.map((item) => item.room_id);

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
    const markupMap = new Map<string, number>();

    for (const item of markupRows as SupabaseRoomAgentMarkupRow[]) {
      markupMap.set(item.room_id, Number(item.markup_percent ?? 0));
    }

    const roomsByProperty = new Map<string, AgentMarkupRoomItem[]>();
    const standaloneRoomMap = new Map<string, AgentMarkupRoomItem>();

    for (const room of allRoomRows) {
      const basePricePerNight = Number(room.price_per_night ?? 0);
      const agentMarkupPercent = markupMap.get(room.id) ?? 0;
      const mappedRoom = {
        id: room.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        basePricePerNight,
        agentMarkupPercent,
        agentPricePerNight: Number((basePricePerNight * (1 + agentMarkupPercent / 100)).toFixed(2)),
      };

      if (room.property_id) {
        const existing = roomsByProperty.get(room.property_id) ?? [];
        existing.push(mappedRoom);
        roomsByProperty.set(room.property_id, existing);
      } else {
        standaloneRoomMap.set(room.id, mappedRoom);
      }
    }

    const propertyItems: AgentCollaborationItem[] = safePropertyLinks.map((item) => ({
      id: item.id,
      targetType: "property",
      targetId: item.property_id,
      title: item.properties?.title ?? "Объект",
      subtitle: "Объект владельца",
      ownerName: item.profiles?.display_name ?? "Владелец",
      ownerContact: getContact(item.profiles),
      ownerContactVisible: Boolean(item.owner_contact_visible),
      status: item.status ?? "active",
      statusLabel: getStatusLabel(item.status ?? "active"),
      terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),

      rooms: roomsByProperty.get(item.property_id) ?? [],
      targets: [buildCollaborationTarget(item.property_id, "property", item.properties?.title ?? "Объект")],
    }));

    const roomItems: AgentCollaborationItem[] = safeRoomLinks.map((item) => ({
      id: item.id,
      targetType: "standalone_room",
      targetId: item.room_id,
      title: item.rooms?.title ?? "Отдельный номер",
      subtitle: item.rooms?.subtitle ?? "Самостоятельный вариант размещения",
      ownerName: item.profiles?.display_name ?? "Владелец",
      ownerContact: getContact(item.profiles),
      ownerContactVisible: Boolean(item.owner_contact_visible),
      status: item.status ?? "active",
      statusLabel: getStatusLabel(item.status ?? "active"),
      terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),

      rooms: standaloneRoomMap.has(item.room_id) ? [standaloneRoomMap.get(item.room_id)!] : [],
      targets: [buildCollaborationTarget(item.room_id, "standalone_room", item.rooms?.title ?? "Отдельный номер")],
    }));

    return [...propertyItems, ...roomItems];
  } catch {
    return [];
  }
}

export async function submitAgentProposal(input: {
  targetType: AgentCollaborationTargetType;
  propertyId?: string;
  roomId?: string;
  message: string;
}) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const target = await resolveProposalTarget({
    profileId: profile.id,
    targetType: input.targetType,
    propertyId: input.propertyId,
    roomId: input.roomId,
  });

  if (!target) {
    return { ok: false as const, reason: "not_available" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const payload = {
      owner_id: target.ownerId,
      agent_id: profile.id,
      status: "pending",
      proposal_message: input.message.trim() || null,
      proposed_at: new Date().toISOString(),
      decided_at: null,
      owner_contact_visible: false,
    };

    if (target.targetType === "property") {
      const { data: existingData } = await supabase
        .from("agent_property_links")
        .select("*")
        .eq("property_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData as SupabaseAgentPropertyLinkRow | null;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const { error } = existing
        ? await supabase.from("agent_property_links").update({ ...payload, property_id: target.targetId }).eq("id", existing.id)
        : await supabase.from("agent_property_links").insert({ ...payload, property_id: target.targetId });

      if (error) {
        return { ok: false as const, reason: "save_failed" as const };
      }
    } else {
      const { data: existingData } = await supabase
        .from("agent_room_links")
        .select("*")
        .eq("room_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData as SupabaseAgentRoomLinkRow | null;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const { error } = existing
        ? await supabase.from("agent_room_links").update({ ...payload, room_id: target.targetId }).eq("id", existing.id)
        : await supabase.from("agent_room_links").insert({ ...payload, room_id: target.targetId });

      if (error) {
        return { ok: false as const, reason: "save_failed" as const };
      }
    }

    await createNotificationEvent({
      recipientId: target.ownerId,
      eventType: "agent_proposal_received",
      payload: {
        propertyId: target.targetType === "property" ? target.targetId : undefined,
        propertyTitle: target.targetType === "property" ? target.title : undefined,
        roomTitle: target.targetType === "standalone_room" ? target.title : undefined,
        linkPath: "/dashboard/agent-proposals",
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}

export async function reviewAgentProposal(input: {
  proposalId: string;
  targetType: AgentCollaborationTargetType;
  decision: "active" | "declined";
}) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !input.proposalId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (input.targetType === "property") {
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

      const { data: propertyDetails } = await supabase.from("properties").select("title").eq("id", proposal.property_id).maybeSingle();

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

      if (input.decision === "active") {
        await markAgentReferralMilestone(proposal.agent_id);
      }

      return { ok: true as const };
    }

    const { data: proposalData } = await supabase
      .from("agent_room_links")
      .select("*")
      .eq("id", input.proposalId)
      .maybeSingle();
    const proposal = proposalData as SupabaseAgentRoomLinkRow | null;

    if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
      return { ok: false as const, reason: "not_found" as const };
    }

    let ownerContactVisible = false;

    if (input.decision === "active") {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("allow_owner_contact_sharing")
        .eq("id", proposal.room_id)
        .maybeSingle();

      ownerContactVisible = Boolean(roomData?.allow_owner_contact_sharing);
    }

    const { error } = await supabase
      .from("agent_room_links")
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

    const { data: roomDetails } = await supabase.from("rooms").select("title").eq("id", proposal.room_id).maybeSingle();

    await createNotificationEvent({
      recipientId: proposal.agent_id,
      eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
      payload: {
        proposalId: proposal.id,
        roomTitle: (roomDetails?.title as string | null) ?? undefined,
        linkPath: input.decision === "active" ? "/agent/dashboard/collaborations" : "/agent/dashboard/opportunities",
      },
    });

    if (input.decision === "active") {
      await markAgentReferralMilestone(proposal.agent_id);
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}




