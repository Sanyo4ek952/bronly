import { getMyNotifications, getMyPushSubscriptionStatus } from "@/entities/notification";
import { PushNotificationsCard } from "@/features/pwa/push-notifications";
import { NotificationsCenter } from "@/widgets/notifications-center";

import {
  markAgentNotificationReadAction,
  markAllAgentNotificationsReadAction,
} from "@/app/agent/dashboard/notifications/actions";

export default async function AgentNotificationsPage() {
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
        description="Все in-app события по заявкам, связям с владельцами и подписке."
        onMarkReadAction={markAgentNotificationReadAction}
        onMarkAllReadAction={markAllAgentNotificationsReadAction}
      />
    </>
  );
}
