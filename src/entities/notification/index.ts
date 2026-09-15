export {
  createNotificationEvent,
  createInAppNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/entities/notification/api/notification-data";
export {
  deletePushSubscription,
  getMyPushSubscriptionStatus,
  listMyPushSubscriptions,
  savePushSubscription,
} from "@/entities/notification/api/push-subscription-data";
export {
  bindTelegramChatFromStartMessage,
  createTelegramLinkSession,
  getMyTelegramNotificationStatus,
} from "@/entities/notification/api/telegram-link";
export { setTelegramNotificationsEnabled } from "@/entities/notification/api/notification-settings";
export type {
  NotificationEventType,
  NotificationListItem,
  NotificationPayload,
  NotificationRoleContext,
} from "@/entities/notification/model/types";
export {
  buildNotificationIdempotencyKey,
  getNotificationDeliveryChannels,
  getNotificationDestinationPath,
  settleNotificationFanOut,
} from "@/entities/notification/model/notification-rules";
