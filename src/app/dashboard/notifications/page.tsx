import { getMyNotifications, getMyPushSubscriptionStatus } from "@/entities/notification";
import { PushNotificationsCard } from "@/features/pwa/push-notifications";
import { NotificationsCenter } from "@/widgets/notifications-center";

import {
  markAllOwnerNotificationsReadAction,
  markOwnerNotificationReadAction,
} from "@/app/dashboard/notifications/actions";

export default async function OwnerNotificationsPage() {
  const [notifications, pushStatus] = await Promise.all([getMyNotifications(), getMyPushSubscriptionStatus()]);

  return (
    <>
      <PushNotificationsCard
        deliveryMode={pushStatus.deliveryMode}
        hasServerSubscriptions={pushStatus.hasSubscriptions}
        initialPushEnabled={pushStatus.pushEnabled}
      />
      <NotificationsCenter
        items={notifications}
        title="Уведомления"
        description="Все in-app события по заявкам, предложениям агентов и подписке."
        onMarkReadAction={markOwnerNotificationReadAction}
        onMarkAllReadAction={markAllOwnerNotificationsReadAction}
      />
    </>
  );
}
