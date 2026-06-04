import type { PublicRoom } from "@/entities/room";
import type { PublicStayFilters } from "@/entities/room";
import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";

export type AgentDashboardSummary = {
  activeCollaborations: number;
  incomingRequests: number;
  completedDeals: number;
  publicLinkLabel: string;
};

export type AgentLinkStatus = "pending" | "active" | "declined" | "revoked";

export type AgentCollaborationItem = {
  id: string;
  propertyTitle: string;
  ownerName: string;
  status: AgentLinkStatus;
  statusLabel: string;
  terms: string;
  propertyId: string;
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

export type AgentAvailablePropertyItem = {
  propertyId: string;
  propertyTitle: string;
  shortTitle: string;
  city: string;
  address: string;
  ownerName: string;
  shortDescription: string;
};

export type AgentProposalItem = {
  id: string;
  propertyTitle: string;
  ownerName: string;
  message: string;
  status: AgentLinkStatus;
  statusLabel: string;
  createdAt: string;
};

export type OwnerIncomingAgentProposalItem = {
  id: string;
  propertyTitle: string;
  agentName: string;
  message: string;
  createdAt: string;
};

export type PublicAgentPropertySection = {
  property: {
    id: string;
    slug: string;
    title: string;
    shortTitle: string;
    city: string;
    address: string;
    photos: import("@/entities/property").PropertyPhoto[];
  };
  rooms: PublicRoom[];
};

export type PublicAgentPageData = {
  agent: {
    id: string;
    slug: string;
    displayName: string;
    phone: string;
    telegram: string;
  } | null;
  properties: PublicAgentPropertySection[];
  filters: PublicStayFilters;
  publicUnavailableReason: PublicUnavailableReason | null;
  publicWarningText: string | null;
};
