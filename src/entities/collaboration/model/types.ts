import type { PublicRoom } from "@/entities/room";
import type { PublicStayFilters } from "@/entities/room";

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
  status: string;
  terms: string;
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
  publicUnavailableReason: "subscription_expired" | null;
  publicWarningText: string | null;
};
