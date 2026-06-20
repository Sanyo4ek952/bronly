import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUnreadNotificationCount } from "@/entities/notification";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { formatDateLabel } from "@/shared/lib/date";
import { createRobots } from "@/shared/lib/seo";
import { OwnerShell } from "@/widgets/owner-shell";

export const metadata: Metadata = {
  robots: createRobots(false),
};

export default async function AgentDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (getPrimaryRole(profile.roles) !== "agent") {
    redirect("/dashboard");
  }

  const [subscription, unreadNotificationsCount] = await Promise.all([
    getSubscriptionRuntimeState(profile.id, "agent"),
    getUnreadNotificationCount(),
  ]);

  const notice = subscription.status === "expired"
    ? {
        title: "Агентская витрина и новые заявки ограничены",
        text: "Подписка не продлена. Кабинет остается доступным для просмотра, но изменения данных временно остановлены, пока администратор не продлит доступ.",
      }
    : subscription.showGraceWarning
      ? {
          title: "Подписку нужно продлить",
          text: subscription.graceEndsAt
            ? `Grace period действует до ${formatDateLabel(subscription.graceEndsAt)}. До этой даты агентская витрина и новые заявки еще доступны.`
            : "Grace period уже начался. Пока он не закончился, агентская витрина и новые заявки еще доступны.",
        }
      : null;

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <OwnerShell
          userName={profile.displayName}
          roleLabel="Агент"
          roleKind="agent"
          topbar={{
            title: `Добро пожаловать, ${profile.displayName}`,
            description: "Держите под рукой витрину, активные связи и заявки по вашим ссылкам.",
            notificationsHref: "/agent/dashboard/notifications",
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
