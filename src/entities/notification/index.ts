export {
  createInAppNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/entities/notification/api/notification-data";
export type {
  NotificationEventType,
  NotificationListItem,
  NotificationPayload,
} from "@/entities/notification/model/types";
