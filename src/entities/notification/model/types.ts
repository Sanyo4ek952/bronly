import type { NotificationEventType, NotificationRoleContext } from "@/entities/notification/model/notification-rules";

export type { NotificationEventType, NotificationRoleContext } from "@/entities/notification/model/notification-rules";

export type NotificationPayload = {
  requestId?: string;
  propertyId?: string;
  propertyTitle?: string;
  roomTitle?: string;
  proposalId?: string;
  subscriptionStatus?: "trial" | "active" | "grace" | "expired" | "manual";
  roleContext?: NotificationRoleContext;
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
