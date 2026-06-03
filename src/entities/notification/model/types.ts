export type NotificationEventType =
  | "new_request"
  | "request_transferred_to_owner"
  | "agent_proposal_received"
  | "agent_proposal_accepted"
  | "agent_proposal_rejected"
  | "subscription_reminder"
  | "subscription_status_changed";

export type NotificationPayload = {
  requestId?: string;
  propertyId?: string;
  propertyTitle?: string;
  roomTitle?: string;
  proposalId?: string;
  subscriptionStatus?: "trial" | "active" | "grace" | "expired" | "manual";
  roleContext?: "owner" | "agent";
  linkPath?: string;
};

export type NotificationListItem = {
  id: string;
  eventType: NotificationEventType;
  title: string;
  description: string;
  createdAt: string;
  createdAtLabel: string;
  isRead: boolean;
  readAt: string | null;
  linkPath: string | null;
  linkLabel: string | null;
};
