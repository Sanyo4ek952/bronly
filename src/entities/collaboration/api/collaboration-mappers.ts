import type {
  AgentAvailablePropertyItem,
  AgentCalendarBusyRange,
  AgentCalendarPropertyItem,
  AgentCalendarRoomItem,
  AgentCollaborationItem,
  AgentMarkupRoomItem,
  AgentProposalItem,
  OwnerActiveCollaborationItem,
  OwnerIncomingAgentProposalItem,
} from "@/entities/collaboration/model/types";
import type { SupabaseRoomAgentMarkupRow } from "@/shared/api/supabase/types";
import { formatDateTimeLabel } from "@/shared/lib/date";

import { buildCollaborationTarget, getCollaborationTerms, getContact, getStatusLabel } from "./collaboration-formatters";
import type {
  AgentPropertyLinkListRow,
  AgentRoomLinkListRow,
  CollaborationRoomRow,
  ProfileContactRow,
} from "./collaboration-types";

export function buildMarkupRoomsLookup(
  allRoomRows: CollaborationRoomRow[],
  markupRows: SupabaseRoomAgentMarkupRow[],
) {
  const markupMap = new Map<string, number>();

  for (const item of markupRows) {
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

  return { roomsByProperty, standaloneRoomMap };
}

export function mapAgentCollaborationItems(input: {
  propertyLinks: AgentPropertyLinkListRow[];
  roomLinks: AgentRoomLinkListRow[];
  roomsByProperty: Map<string, AgentMarkupRoomItem[]>;
  standaloneRoomMap: Map<string, AgentMarkupRoomItem>;
  defaultStatus: "pending" | "active";
}) {
  const propertyItems: AgentCollaborationItem[] = input.propertyLinks.map((item) => ({
    id: item.id,
    targetType: "property",
    targetId: item.property_id,
    title: item.properties?.title ?? "Объект",
    subtitle: "Объект владельца",
    ownerName: item.profiles?.display_name ?? "Владелец",
    ownerContact: getContact(item.profiles),
    ownerContactVisible: Boolean(item.owner_contact_visible),
    status: item.status ?? input.defaultStatus,
    statusLabel: getStatusLabel(item.status ?? input.defaultStatus),
    terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),
    rooms: input.roomsByProperty.get(item.property_id) ?? [],
    targets: [buildCollaborationTarget(item.property_id, "property", item.properties?.title ?? "Объект")],
  }));

  const roomItems: AgentCollaborationItem[] = input.roomLinks.map((item) => ({
    id: item.id,
    targetType: "standalone_room",
    targetId: item.room_id,
    title: item.rooms?.title ?? "Отдельный номер",
    subtitle: item.rooms?.subtitle ?? "Самостоятельный вариант размещения",
    ownerName: item.profiles?.display_name ?? "Владелец",
    ownerContact: getContact(item.profiles),
    ownerContactVisible: Boolean(item.owner_contact_visible),
    status: item.status ?? input.defaultStatus,
    statusLabel: getStatusLabel(item.status ?? input.defaultStatus),
    terms: getCollaborationTerms(item.collaboration_terms, item.proposal_message),
    rooms: input.standaloneRoomMap.has(item.room_id) ? [input.standaloneRoomMap.get(item.room_id)!] : [],
    targets: [buildCollaborationTarget(item.room_id, "standalone_room", item.rooms?.title ?? "Отдельный номер")],
  }));

  return [...propertyItems, ...roomItems];
}

export function mapAgentCalendarItems(input: {
  properties: Array<{ id: string; title: string; city: string; address: string }>;
  propertyRooms: Array<{ id: string; property_id: string; title: string; subtitle: string | null }>;
  standaloneRooms: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    property_type: string | null;
    city: string | null;
    address: string | null;
  }>;
  busyMap: Map<string, AgentCalendarBusyRange[]>;
}) {
  const roomsByProperty = new Map<string, AgentCalendarRoomItem[]>();

  for (const room of input.propertyRooms) {
    const existing = roomsByProperty.get(room.property_id) ?? [];
    existing.push({
      id: room.id,
      title: room.title,
      subtitle: room.subtitle ?? "",
      busyRanges: (input.busyMap.get(room.id) ?? []).sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
    });
    roomsByProperty.set(room.property_id, existing);
  }

  const propertyItems: AgentCalendarPropertyItem[] = input.properties
    .map((property) => ({
      id: property.id,
      targetType: "property" as const,
      title: property.title,
      subtitle: [property.city, property.address].filter(Boolean).join(", "),
      rooms: roomsByProperty.get(property.id) ?? [],
    }))
    .filter((item) => item.rooms.length > 0);

  const standaloneItems: AgentCalendarPropertyItem[] = input.standaloneRooms.map((room) => ({
    id: room.id,
    targetType: "standalone_room" as const,
    title: room.title,
    subtitle: [room.property_type ?? "Отдельный номер", room.city ?? "", room.address ?? ""].filter(Boolean).join(" • "),
    rooms: [
      {
        id: room.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        busyRanges: (input.busyMap.get(room.id) ?? []).sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
      },
    ],
  }));

  return [...propertyItems, ...standaloneItems];
}

export function mapAgentAvailablePropertyItems(input: {
  properties: Array<{
    id: string;
    owner_id: string;
    title: string;
    short_title: string;
    city: string;
    address: string;
    short_description: string | null;
  }>;
  standaloneRooms: Array<{
    id: string;
    owner_id: string;
    title: string;
    subtitle: string | null;
    property_type: string | null;
    city: string | null;
    address: string | null;
    short_description: string | null;
  }>;
  blockedPropertyIds: Set<string>;
  blockedRoomIds: Set<string>;
  ownerNameMap: Map<string, string>;
}) {
  const propertyItems: AgentAvailablePropertyItem[] = input.properties
    .filter((property) => !input.blockedPropertyIds.has(property.id))
    .map((property) => ({
      targetType: "property",
      propertyId: property.id,
      roomId: null,
      title: property.title,
      shortTitle: property.short_title,
      city: property.city,
      address: property.address,
      ownerName: input.ownerNameMap.get(property.owner_id) ?? "Владелец",
      shortDescription: property.short_description ?? "",
    }));

  const roomItems: AgentAvailablePropertyItem[] = input.standaloneRooms
    .filter((room) => !input.blockedRoomIds.has(room.id))
    .map((room) => ({
      targetType: "standalone_room",
      propertyId: null,
      roomId: room.id,
      title: room.title,
      shortTitle: room.title,
      city: room.city ?? "",
      address: room.address ?? "",
      ownerName: input.ownerNameMap.get(room.owner_id) ?? "Владелец",
      shortDescription: room.short_description ?? room.subtitle ?? room.property_type ?? "",
    }));

  return [...propertyItems, ...roomItems];
}

export function mapAgentProposalItems(input: {
  propertyLinks: Array<{ id: string; status?: string | null; proposal_message?: string | null; proposed_at?: string | null; properties?: { title?: string } | null; profiles?: { display_name?: string } | null }>;
  roomLinks: Array<{ id: string; status?: string | null; proposal_message?: string | null; proposed_at?: string | null; rooms?: { title?: string } | null; profiles?: { display_name?: string } | null }>;
}): AgentProposalItem[] {
  const propertyItems = input.propertyLinks.map((item) => ({
    id: item.id as string,
    targetType: "property" as const,
    title: (item.properties?.title ?? "Объект"),
    ownerName: (item.profiles?.display_name ?? "Владелец"),
    message: item.proposal_message ?? "",
    status: (item.status ?? "pending") as AgentProposalItem["status"],
    statusLabel: getStatusLabel((item.status ?? "pending") as AgentProposalItem["status"]),
    createdAt: formatDateTimeLabel(item.proposed_at ?? new Date().toISOString()),
  }));
  const roomItems = input.roomLinks.map((item) => ({
    id: item.id as string,
    targetType: "standalone_room" as const,
    title: (item.rooms?.title ?? "Отдельный номер"),
    ownerName: (item.profiles?.display_name ?? "Владелец"),
    message: item.proposal_message ?? "",
    status: (item.status ?? "pending") as AgentProposalItem["status"],
    statusLabel: getStatusLabel((item.status ?? "pending") as AgentProposalItem["status"]),
    createdAt: formatDateTimeLabel(item.proposed_at ?? new Date().toISOString()),
  }));

  return [...propertyItems, ...roomItems];
}

export function mapOwnerIncomingProposalItems(input: {
  propertyLinks: Array<{ id: string; proposal_message?: string | null; proposed_at?: string | null; properties?: { title?: string } | null; profiles?: { display_name?: string } | null }>;
  roomLinks: Array<{ id: string; proposal_message?: string | null; proposed_at?: string | null; rooms?: { title?: string } | null; profiles?: { display_name?: string } | null }>;
}): OwnerIncomingAgentProposalItem[] {
  const propertyItems = input.propertyLinks.map((item) => ({
    id: item.id as string,
    targetType: "property" as const,
    title: item.properties?.title ?? "Объект",
    agentName: item.profiles?.display_name ?? "Агент",
    message: item.proposal_message ?? "",
    createdAt: formatDateTimeLabel(item.proposed_at ?? new Date().toISOString()),
  }));
  const roomItems = input.roomLinks.map((item) => ({
    id: item.id as string,
    targetType: "standalone_room" as const,
    title: item.rooms?.title ?? "Отдельный номер",
    agentName: item.profiles?.display_name ?? "Агент",
    message: item.proposal_message ?? "",
    createdAt: formatDateTimeLabel(item.proposed_at ?? new Date().toISOString()),
  }));

  return [...propertyItems, ...roomItems];
}

export function mapOwnerActiveCollaborations(input: {
  propertyLinks: Array<{
    agent_id: string;
    proposal_message: string | null;
    collaboration_terms: string | null;
    properties: { id?: string; title?: string } | null;
    profiles: ProfileContactRow | null;
  }>;
  roomLinks: Array<{
    agent_id: string;
    proposal_message: string | null;
    collaboration_terms: string | null;
    rooms: { id?: string; title?: string } | null;
    profiles: ProfileContactRow | null;
  }>;
}): OwnerActiveCollaborationItem[] {
  const grouped = new Map<string, OwnerActiveCollaborationItem>();

  for (const item of input.propertyLinks) {
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

  for (const item of input.roomLinks) {
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
}
