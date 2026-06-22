import type { DashboardTopbarProps } from "@/widgets/dashboard-topbar";

import { formatDateLabel } from "@/shared/lib/date";

type SubscriptionLike = {
  status: string;
  showGraceWarning: boolean;
  graceEndsAt?: string | null;
};

type DashboardRoleKind = "owner" | "agent";

type DashboardShellData = {
  roleLabel: string;
  roleKind: DashboardRoleKind;
  topbar: DashboardTopbarProps;
  notice: {
    title: string;
    text: string;
  } | null;
};

export function buildSubscriptionNotice(role: DashboardRoleKind, subscription: SubscriptionLike) {
  if (subscription.status === "expired") {
    return {
      title: role === "agent" ? "Агентская витрина и новые заявки ограничены" : "Публичные страницы и новые заявки ограничены",
      text: "Подписка не продлена. Кабинет остается доступным для просмотра, но изменения данных временно остановлены, пока администратор не продлит доступ.",
    };
  }

  if (!subscription.showGraceWarning) {
    return null;
  }

  const activeSurface = role === "agent" ? "агентская витрина и новые заявки" : "публичные страницы и новые заявки";

  return {
    title: "Подписку нужно продлить",
    text: subscription.graceEndsAt
      ? `Grace period действует до ${formatDateLabel(subscription.graceEndsAt)}. До этой даты ${activeSurface} еще доступны.`
      : `Grace period уже начался. Пока он не закончился, ${activeSurface} еще доступны.`,
  };
}

export function buildDashboardShellData({
  role,
  displayName,
  unreadNotificationsCount,
  subscription,
  hasAdminRole = false,
  hasOwnerRole = false,
}: {
  role: DashboardRoleKind;
  displayName: string;
  unreadNotificationsCount: number;
  subscription: SubscriptionLike;
  hasAdminRole?: boolean;
  hasOwnerRole?: boolean;
}): DashboardShellData {
  return {
    roleKind: role,
    roleLabel:
      role === "agent" ? "Агент" : hasAdminRole ? "Администратор" : hasOwnerRole ? "Владелец" : "Владелец",
    topbar: {
      title: `Добро пожаловать, ${displayName}`,
      description:
        role === "agent"
          ? "Держите под рукой витрину, активные связи и заявки по вашим ссылкам."
          : "Следите за объектами, календарём занятости и заявками в одном месте.",
      notificationsHref: role === "agent" ? "/agent/dashboard/notifications" : "/dashboard/notifications",
      unreadNotificationsCount,
    },
    notice: buildSubscriptionNotice(role, subscription),
  };
}
