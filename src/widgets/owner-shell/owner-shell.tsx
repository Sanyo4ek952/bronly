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

import { signOutAction } from "@/app/auth/actions";
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

export type OwnerShellProps = {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  roleKind?: "owner" | "agent";
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

  return (
    <div className="br-owner">
      <aside className="br-owner__sidebar br-card">
        <div className="br-owner__brand">
          <BrandLogo />
        </div>

        <nav className="br-owner-nav" aria-label="Навигация кабинета">
          {desktopItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`br-owner-nav__item${isActive ? " br-owner-nav__item--active" : ""}`}
              >
                <AppIcon icon={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="br-owner-profile">
          <div className="br-owner-profile__avatar">{userInitial}</div>
          <div>
            <strong>{userName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>

        <form action={signOutAction}>
          <Button className="br-owner-signout" variant="ghost" fullWidth type="submit">
            Выйти
          </Button>
        </form>
      </aside>

      <div className="br-owner__content">
        {pathname === dashboardRootPath && topbar ? <DashboardTopbar {...topbar} /> : null}

        {notice ? (
          <InlineNotice title={notice.title} aria-live="polite">
            <span>{notice.text}</span>
          </InlineNotice>
        ) : null}

        {children}

        <nav className="br-owner-bottom-nav br-card" aria-label="Мобильная навигация">
          {mobilePrimaryItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`br-owner-bottom-nav__item${isActive ? " br-owner-bottom-nav__item--active" : ""}`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <AppIcon icon={item.icon} aria-hidden="true" />
                <span className="br-visually-hidden">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={`br-owner-bottom-nav__item${isMobileMenuOpen || isOverflowActive ? " br-owner-bottom-nav__item--active" : ""}`}
            aria-expanded={isMobileMenuOpen}
            aria-controls="br-owner-mobile-menu"
            aria-label="Ещё"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <AppIcon icon={Menu} aria-hidden="true" />
            <span className="br-visually-hidden">Ещё</span>
          </button>
        </nav>

        <BottomSheet
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          dialogId="br-owner-mobile-menu"
          titleId="br-owner-mobile-sheet-title"
          title="Ещё"
          description="Быстрый доступ к остальным разделам кабинета."
          closeLabel="Закрыть"
          className="br-owner-mobile-sheet"
          bodyClassName="br-owner-mobile-sheet__list"
        >
          {({ close }) => (
            <>
              {mobileOverflowItems.map((item) => {
                const isActive = isItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`br-owner-mobile-sheet__item${isActive ? " br-owner-mobile-sheet__item--active" : ""}`}
                    onClick={close}
                  >
                    <AppIcon icon={item.icon} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <form action={signOutAction} className="br-owner-mobile-sheet__form">
                <button
                  type="submit"
                  className="br-owner-mobile-sheet__item br-owner-mobile-sheet__item--button"
                >
                  <AppIcon icon={LogOut} aria-hidden="true" />
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
