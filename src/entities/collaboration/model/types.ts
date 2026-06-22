import type { PublicPropertySummary } from "@/entities/property";
import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";

export type AgentDashboardSummary = {
  activeCollaborations: number;
  incomingRequests: number;
  completedDeals: number;
  publicLinkLabel: string;
  publicLinkHref: string | null;
};

export type AgentLinkStatus = "pending" | "active" | "declined" | "revoked";
export type AgentCollaborationTargetType = "property" | "standalone_room";

export type CollaborationTargetSummary = {
  id: string;
  targetType: AgentCollaborationTargetType;
  targetTitle: string;
};

export type CollaborationContact = {
  phone: string;
  whatsapp: string;
  telegram: string;
};

export type AgentCollaborationItem = {
  id: string;
  targetType: AgentCollaborationTargetType;
  targetId: string;
  title: string;
  subtitle: string;
  ownerName: string;
  ownerContact: CollaborationContact;
  ownerContactVisible: boolean;
  status: AgentLinkStatus;
  statusLabel: string;
  terms: string;
  targets: CollaborationTargetSummary[];
  rooms: AgentMarkupRoomItem[];
};

export type AgentMarkupRoomItem = {
  id: string;
  title: string;
  subtitle: string;
  basePricePerNight: number;
  agentMarkupPercent: number;
  agentPricePerNight: number;
};

export type AgentCalendarBusyRange = {
  id: string;
  startsOn: string;
  endsOn: string;
  label: string;
  note: string;
};

export type AgentCalendarRoomItem = {
  id: string;
  title: string;
  subtitle: string;
  busyRanges: AgentCalendarBusyRange[];
};

export type AgentCalendarPropertyItem = {
  id: string;
  targetType: AgentCollaborationTargetType;
  title: string;
  subtitle: string;
  rooms: AgentCalendarRoomItem[];
};

export type AgentAvailablePropertyItem = {
  targetType: AgentCollaborationTargetType;
  propertyId: string | null;
  roomId: string | null;
  title: string;
  shortTitle: string;
  city: string;
  address: string;
  ownerName: string;
  shortDescription: string;
};

export type AgentProposalItem = {
  id: string;
  targetType: AgentCollaborationTargetType;
  title: string;
  ownerName: string;
  message: string;
  status: AgentLinkStatus;
  statusLabel: string;
  createdAt: string;
};

export type OwnerIncomingAgentProposalItem = {
  id: string;
  targetType: AgentCollaborationTargetType;
  title: string;
  agentName: string;
  message: string;
  createdAt: string;
};

export type OwnerActiveCollaborationItem = {
  agentId: string;
  agentName: string;
  agentContact: CollaborationContact;
  terms: string;
  targets: CollaborationTargetSummary[];
};

export type PublicAgentPropertySection = {
  property: PublicPropertySummary;
  rooms: PublicRoom[];
};

export type PublicAgentPageData = {
  agent: {
    id: string;
    publicId: string;
    legacySlug: string;
    displayName: string;
    phone: string;
    telegram: string;
  } | null;
  properties: PublicAgentPropertySection[];
  standaloneRooms: PublicRoom[];
  filters: PublicStayFilters;
  publicUnavailableReason: PublicUnavailableReason | null;
  publicWarningText: string | null;
  shouldRedirectToCanonical: boolean;
};
