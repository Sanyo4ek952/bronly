import { getMyNotifications } from "@/entities/notification";
import { NotificationsCenter } from "@/widgets/notifications-center";

import {
  markAllOwnerNotificationsReadAction,
  markOwnerNotificationReadAction,
} from "@/app/dashboard/notifications/actions";

export default async function OwnerNotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <NotificationsCenter
      items={notifications}
      title="Уведомления"
      description="Все in-app события по заявкам, предложениям агентов и подписке."
      onMarkReadAction={markOwnerNotificationReadAction}
      onMarkAllReadAction={markAllOwnerNotificationsReadAction}
    />
  );
}
