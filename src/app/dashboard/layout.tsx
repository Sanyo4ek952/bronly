import { redirect } from "next/navigation";

import { getUnreadNotificationCount } from "@/entities/notification";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { formatDateLabel } from "@/shared/lib/date";
import { OwnerShell } from "@/widgets/owner-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (getPrimaryRole(profile.roles) === "agent" && !profile.roles.includes("owner")) {
    redirect("/agent/dashboard");
  }

  const [subscription, unreadNotificationsCount] = await Promise.all([
    getSubscriptionRuntimeState(profile.id, "owner"),
    getUnreadNotificationCount(),
  ]);

  const roleLabel = profile.roles.includes("agent") && !profile.roles.includes("owner")
    ? "Агент"
    : profile.roles.includes("admin")
      ? "Администратор"
      : "Владелец";

  const notice = subscription.status === "expired"
    ? {
        title: "Публичные страницы и новые заявки ограничены",
        text: "Подписка не продлена. Кабинет остается доступным для просмотра, но изменения данных временно остановлены, пока администратор не продлит доступ.",
      }
    : subscription.showGraceWarning
      ? {
          title: "Подписку нужно продлить",
          text: subscription.graceEndsAt
            ? `Grace period действует до ${formatDateLabel(subscription.graceEndsAt)}. До этой даты публичные страницы и новые заявки еще доступны.`
            : "Grace period уже начался. Пока он не закончился, публичные страницы и новые заявки еще доступны.",
        }
      : null;

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <OwnerShell
          userName={profile.displayName}
          roleLabel={roleLabel}
          topbar={{
            title: `Добро пожаловать, ${profile.displayName}`,
            description: "Следите за объектами, календарём занятости и заявками в одном месте.",
            notificationsHref: "/dashboard/notifications",
            unreadNotificationsCount,
          }}
          notice={notice}
        >
          {children}
        </OwnerShell>
      </div>
    </main>
  );
}
