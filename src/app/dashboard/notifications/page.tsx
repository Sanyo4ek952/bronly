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
    <section className="grid gap-6 max-[640px]:gap-5">
      <header className="grid max-w-[760px] gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">События кабинета</p>
        <h1 className="text-[clamp(32px,5vw,46px)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text)]">
          Уведомления
        </h1>
        <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
          Следите за новыми заявками, предложениями агентов и изменениями подписки в одном месте.
        </p>
      </header>

      <div className="grid min-w-0 items-start gap-[22px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <NotificationsCenter
          items={notifications}
          title="Последние события"
          description="Сначала показываем новые события."
          onMarkReadAction={markOwnerNotificationReadAction}
          onMarkAllReadAction={markAllOwnerNotificationsReadAction}
          presentation="owner"
        />
        <PushNotificationsCard
          deliveryMode={pushStatus.deliveryMode}
          hasServerSubscriptions={pushStatus.hasSubscriptions}
          initialPushEnabled={pushStatus.pushEnabled}
          presentation="owner"
        />
      </div>
    </section>
  );
}
