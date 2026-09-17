"use client";

import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  Handshake,
  Home,
  Inbox,
  Layers3,
  Link2,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutAction } from "@/features/auth/sign-out-action";
import { cn } from "@/shared/lib/cn";
import { AppIcon, BottomSheet, Button, type AppIconComponent, BrandLogo, InlineNotice } from "@/shared/ui";
import { DashboardTopbar, type DashboardTopbarProps } from "@/widgets/dashboard-topbar";

type NavigationItem = {
  href: string;
  label: string;
  icon: AppIconComponent;
};

type NavigationConfig = {
  desktopItems: NavigationItem[];
  mobilePrimaryItems: NavigationItem[];
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/dashboard/notifications", label: "Уведомления", icon: Bell },
  { href: "/dashboard/properties", label: "Объекты", icon: Building2 },
  { href: "/dashboard/collections", label: "Коллекции", icon: Layers3 },
  { href: "/dashboard/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/dashboard/subscription", label: "Подписка", icon: CreditCard },
  { href: "/dashboard/agent-proposals", label: "Агенты", icon: Handshake },
  { href: "/dashboard/requests", label: "Заявки", icon: Inbox },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

const agentNavigationItems: NavigationItem[] = [
  { href: "/agent/dashboard", label: "Главная", icon: Home },
  { href: "/agent/dashboard/notifications", label: "Уведомления", icon: Bell },
  { href: "/agent/dashboard/collections", label: "Коллекции", icon: Layers3 },
  { href: "/agent/dashboard/opportunities", label: "К сотрудничеству", icon: Search },
  { href: "/agent/dashboard/collaborations", label: "Связи", icon: Link2 },
  { href: "/agent/dashboard/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/agent/dashboard/subscription", label: "Подписка", icon: CreditCard },
  { href: "/agent/dashboard/requests", label: "Заявки", icon: Inbox },
  { href: "/agent/dashboard/deals", label: "Сделки", icon: BadgeCheck },
  { href: "/agent/dashboard/settings", label: "Настройки", icon: Settings },
];

const ownerMobilePrimaryHrefs = [
  "/dashboard",
  "/dashboard/properties",
  "/dashboard/calendar",
  "/dashboard/requests",
] as const;

const agentMobilePrimaryHrefs = [
  "/agent/dashboard",
  "/agent/dashboard/collections",
  "/agent/dashboard/calendar",
  "/agent/dashboard/requests",
] as const;

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && href !== "/agent/dashboard" && pathname.startsWith(href));
}

function getNavigationConfig(roleKind: "owner" | "agent"): NavigationConfig {
  const desktopItems = roleKind === "agent" ? agentNavigationItems : navigationItems;
  const mobilePrimaryHrefs = roleKind === "agent" ? agentMobilePrimaryHrefs : ownerMobilePrimaryHrefs;
  const mobilePrimaryItems = mobilePrimaryHrefs
    .map((href) => desktopItems.find((item) => item.href === href))
    .filter((item): item is NavigationItem => Boolean(item));

  return {
    desktopItems,
    mobilePrimaryItems,
  };
}

function getNavigationItemClass(isActive: boolean, surface: "sidebar" | "bottom" | "sheet") {
  return cn(
    "inline-flex items-center font-bold text-[var(--text-muted)] transition-[background-color,color,box-shadow] duration-[180ms]",
    "hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
    surface === "sidebar" && "min-h-11 gap-2.5 rounded-[14px] px-3.5 text-sm",
    surface === "bottom" && cn(
      "relative min-h-14 justify-center gap-0 rounded-[18px] border-0 bg-transparent p-2",
      "max-[640px]:min-h-[50px] max-[640px]:rounded-[16px] max-[640px]:p-1.5",
    ),
    surface === "sheet" && "min-h-[52px] gap-3 rounded-[var(--radius-lg)] px-3.5 text-[15px]",
    isActive && cn(
      "bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--accent-strong)]",
      surface === "bottom" && "shadow-[inset_0_0_0_1px_rgb(var(--color-primary-rgb)_/_0.18)]",
    ),
  );
}

function NotificationCountBadge({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-[var(--color-danger)] font-extrabold leading-none text-white",
        compact
          ? "absolute right-1 top-1 min-h-3.5 min-w-3.5 px-1 text-[9px]"
          : "ml-auto min-h-5 min-w-5 px-1.5 text-[10px]",
      )}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

export type OwnerShellProps = {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  roleKind?: "owner" | "agent";
  unreadNotificationsCount?: number;
  topbar?: DashboardTopbarProps | null;
  notice?: {
    title: string;
    text: string;
  } | null;
};

export function OwnerShell({
  children,
  userName,
  roleLabel,
  roleKind = "owner",
  unreadNotificationsCount = 0,
  topbar = null,
  notice = null,
}: OwnerShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userInitial = userName.charAt(0).toUpperCase() || "B";
  const { desktopItems, mobilePrimaryItems } = getNavigationConfig(roleKind);
  const dashboardRootPath = roleKind === "agent" ? "/agent/dashboard" : "/dashboard";
  const mobileOverflowItems = desktopItems.filter(
    (item) => !mobilePrimaryItems.some((primaryItem) => primaryItem.href === item.href),
  );
  const isOverflowActive = mobileOverflowItems.some((item) => isItemActive(pathname, item.href));
  const hasUnreadNotifications = unreadNotificationsCount > 0;

  return (
    <div className="grid w-full grid-cols-[224px_minmax(0,1fr)] items-start gap-[30px] pb-[var(--safe-area-bottom)] max-[1080px]:min-h-full max-[1080px]:flex-1 max-[1080px]:grid-cols-1 max-[1080px]:gap-4">
      <aside className="sticky top-6 grid gap-5 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface),var(--surface-subtle))] px-4 py-[18px] shadow-[var(--shadow-md)] max-[1080px]:hidden">
        <div className="px-2.5 pb-1 pt-2">
          <BrandLogo />
        </div>

        <nav className="grid gap-1.5" aria-label="Навигация кабинета">
          {desktopItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);
            const isNotificationsItem = item.href.endsWith("/notifications");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={getNavigationItemClass(isActive, "sidebar")}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  isNotificationsItem && hasUnreadNotifications
                    ? `${item.label}. Непрочитанных уведомлений: ${unreadNotificationsCount}`
                    : undefined
                }
              >
                <AppIcon icon={item.icon} className="size-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
                {isNotificationsItem ? <NotificationCountBadge count={unreadNotificationsCount} /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="grid grid-cols-[42px_1fr] items-center gap-2.5 border-t border-[var(--border)] pt-4">
          <div className="grid size-[42px] place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--accent-strong)]">{userInitial}</div>
          <div className="min-w-0">
            <strong className="block truncate">{userName}</strong>
            <span className="mt-1 block text-[13px] text-[var(--text-muted)]">{roleLabel}</span>
          </div>
        </div>

        <form action={signOutAction}>
          <Button className="justify-start" variant="ghost" fullWidth type="submit">
            Выйти
          </Button>
        </form>
      </aside>

      <div className="grid min-w-0 gap-6 max-[1080px]:flex max-[1080px]:min-h-full max-[1080px]:w-full max-[1080px]:flex-1 max-[1080px]:flex-col max-[1080px]:gap-5 max-[1080px]:pb-[calc(88px+var(--safe-area-bottom))]">
        {pathname === dashboardRootPath && topbar ? <DashboardTopbar {...topbar} /> : null}

        {notice ? (
          <InlineNotice title={notice.title} aria-live="polite">
            <span>{notice.text}</span>
          </InlineNotice>
        ) : null}

        {children}

        <nav className="fixed inset-x-3 bottom-0 z-20 hidden grid-cols-5 gap-1 rounded-t-[18px] border border-[var(--border)] bg-[var(--surface)] p-2 pb-[calc(8px+var(--safe-area-bottom))] shadow-[var(--shadow-md)] max-[1080px]:grid max-[640px]:inset-x-2.5 max-[640px]:p-1.5 max-[640px]:pb-[calc(6px+var(--safe-area-bottom))]" aria-label="Мобильная навигация">
          {mobilePrimaryItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={getNavigationItemClass(isActive, "bottom")}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <AppIcon icon={item.icon} className="size-5" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={getNavigationItemClass(isMobileMenuOpen || isOverflowActive, "bottom")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="owner-mobile-menu"
            aria-label={
              hasUnreadNotifications
                ? `Ещё. Непрочитанных уведомлений: ${unreadNotificationsCount}`
                : "Ещё"
            }
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <AppIcon icon={Menu} className="size-5" aria-hidden="true" />
            <span className="sr-only">Ещё</span>
            <NotificationCountBadge count={unreadNotificationsCount} compact />
          </button>
        </nav>

        <BottomSheet
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          dialogId="owner-mobile-menu"
          titleId="owner-mobile-sheet-title"
          title="Ещё"
          description="Быстрый доступ к остальным разделам кабинета."
          closeLabel="Закрыть"
          bodyClassName="gap-2"
        >
          {({ close }) => (
            <>
              {mobileOverflowItems.map((item) => {
                const isActive = isItemActive(pathname, item.href);
                const isNotificationsItem = item.href.endsWith("/notifications");

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={getNavigationItemClass(isActive, "sheet")}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={
                      isNotificationsItem && hasUnreadNotifications
                        ? `${item.label}. Непрочитанных уведомлений: ${unreadNotificationsCount}`
                        : undefined
                    }
                    onClick={close}
                  >
                    <AppIcon icon={item.icon} className="size-[18px]" aria-hidden="true" />
                    <span>{item.label}</span>
                    {isNotificationsItem ? <NotificationCountBadge count={unreadNotificationsCount} /> : null}
                  </Link>
                );
              })}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className={cn(getNavigationItemClass(false, "sheet"), "w-full border-0 bg-transparent text-left")}
                >
                  <AppIcon icon={LogOut} className="size-[18px]" aria-hidden="true" />
                  <span>Выйти</span>
                </button>
              </form>
            </>
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
