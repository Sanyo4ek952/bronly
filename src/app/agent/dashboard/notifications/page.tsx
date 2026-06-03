import { getMyNotifications } from "@/entities/notification";
import { NotificationsCenter } from "@/widgets/notifications-center";

import {
  markAgentNotificationReadAction,
  markAllAgentNotificationsReadAction,
} from "@/app/agent/dashboard/notifications/actions";

export default async function AgentNotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <NotificationsCenter
      items={notifications}
      title="Уведомления"
      description="Все in-app события по заявкам, связям с владельцами и подписке."
      onMarkReadAction={markAgentNotificationReadAction}
      onMarkAllReadAction={markAllAgentNotificationsReadAction}
    />
  );
}
