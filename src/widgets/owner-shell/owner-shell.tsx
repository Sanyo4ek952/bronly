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
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOutAction } from "@/app/auth/actions";
import { AppIcon, type AppIconComponent, BrandLogo } from "@/shared/ui";

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
  { href: "/dashboard/rooms", label: "Номера", icon: Link2 },
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
  { href: "/agent/dashboard/requests", label: "Заявки", icon: Inbox },
  { href: "/agent/dashboard/deals", label: "Сделки", icon: BadgeCheck },
  { href: "/agent/dashboard/settings", label: "Настройки", icon: Settings },
];

const ownerMobilePrimaryHrefs = [
  "/dashboard",
  "/dashboard/rooms",
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

type OwnerShellProps = {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  roleKind?: "owner" | "agent";
  unreadNotificationsCount?: number;
  notificationsHref?: string;
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
  notificationsHref = roleKind === "agent" ? "/agent/dashboard/notifications" : "/dashboard/notifications",
  notice = null,
}: OwnerShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userInitial = userName.charAt(0).toUpperCase() || "B";
  const { desktopItems, mobilePrimaryItems } = getNavigationConfig(roleKind);
  const mobileOverflowItems = desktopItems.filter(
    (item) => !mobilePrimaryItems.some((primaryItem) => primaryItem.href === item.href),
  );
  const isOverflowActive = mobileOverflowItems.some((item) => isItemActive(pathname, item.href));
  const badgeLabel = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

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
          <button className="br-button br-button--secondary br-button--full" type="submit">
            Выйти
          </button>
        </form>
      </aside>

      <div className="br-owner__content">
        <header className="br-owner-topbar br-card">
          <div>
            <h1>Добро пожаловать, {userName}</h1>
            <p>Следите за объектами, календарём занятости и заявками в одном месте.</p>
          </div>
          <div className="br-owner-topbar__actions">
            <span className="br-owner-topbar__chip">Bronly</span>
            <Link className="br-icon-link" href={notificationsHref} aria-label="Уведомления">
              <AppIcon icon={Bell} aria-hidden="true" />
              {unreadNotificationsCount > 0 ? <span className="br-icon-link__badge">{badgeLabel}</span> : null}
            </Link>
          </div>
        </header>

        {notice ? (
          <section className="br-inline-notice" aria-live="polite">
            <strong style={{ display: "block", marginBottom: 6 }}>{notice.title}</strong>
            <span>{notice.text}</span>
          </section>
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
              >
                <AppIcon icon={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
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
            <span>Ещё</span>
          </button>
        </nav>

        {isMobileMenuOpen ? (
          <div
            className="br-owner-mobile-sheet-backdrop"
            role="presentation"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              id="br-owner-mobile-menu"
              className="br-owner-mobile-sheet br-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="br-owner-mobile-sheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="br-owner-mobile-sheet__handle" aria-hidden="true" />
              <div className="br-owner-mobile-sheet__header">
                <div>
                  <h2 id="br-owner-mobile-sheet-title">Ещё</h2>
                  <p>Быстрый доступ к остальным разделам кабинета.</p>
                </div>
                <button
                  type="button"
                  className="br-owner-mobile-sheet__close"
                  aria-label="Закрыть"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <AppIcon icon={X} aria-hidden="true" />
                </button>
              </div>

              <div className="br-owner-mobile-sheet__list">
                {mobileOverflowItems.map((item) => {
                  const isActive = isItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`br-owner-mobile-sheet__item${isActive ? " br-owner-mobile-sheet__item--active" : ""}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <AppIcon icon={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
