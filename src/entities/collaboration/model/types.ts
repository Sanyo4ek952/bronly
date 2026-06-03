export type AgentDashboardSummary = {
  activeCollaborations: number;
  incomingRequests: number;
  completedDeals: number;
  publicLinkLabel: string;
};

export type AgentCollaborationItem = {
  id: string;
  propertyTitle: string;
  ownerName: string;
  status: string;
  terms: string;
};
