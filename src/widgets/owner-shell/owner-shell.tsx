"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { BrandLogo } from "@/shared/ui";

const navigationItems = [
  { href: "/dashboard", label: "Главная", icon: "⌂" },
  { href: "/dashboard/notifications", label: "Уведомления", icon: "⎃" },
  { href: "/dashboard/properties", label: "Объекты", icon: "⌘" },
  { href: "/dashboard/collections", label: "Коллекции", icon: "♦" },
  { href: "/dashboard/rooms", label: "Номера", icon: "◫" },
  { href: "/dashboard/calendar", label: "Календарь", icon: "◷" },
  { href: "/dashboard/subscription", label: "Подписка", icon: "◈" },
  { href: "/dashboard/agent-proposals", label: "Агенты", icon: "☲" },
  { href: "/dashboard/requests", label: "Заявки", icon: "✉" },
  { href: "/dashboard/settings", label: "Настройки", icon: "⚙" },
];

const agentNavigationItems = [
  { href: "/agent/dashboard", label: "Главная", icon: "⌂" },
  { href: "/agent/dashboard/notifications", label: "Уведомления", icon: "⎃" },
  { href: "/agent/dashboard/collections", label: "Коллекции", icon: "♦" },
  { href: "/agent/dashboard/opportunities", label: "К сотрудничеству", icon: "☲" },
  { href: "/agent/dashboard/collaborations", label: "Связи", icon: "⌘" },
  { href: "/agent/dashboard/calendar", label: "Календарь", icon: "◷" },
  { href: "/agent/dashboard/requests", label: "Заявки", icon: "✉" },
  { href: "/agent/dashboard/deals", label: "Сделки", icon: "◷" },
  { href: "/agent/dashboard/settings", label: "Настройки", icon: "⚙" },
];

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
  const userInitial = userName.charAt(0).toUpperCase() || "B";
  const items = roleKind === "agent" ? agentNavigationItems : navigationItems;
  const badgeLabel = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  return (
    <div className="br-owner">
      <aside className="br-owner__sidebar br-card">
        <div className="br-owner__brand">
          <BrandLogo />
        </div>

        <nav className="br-owner-nav" aria-label="Навигация кабинета">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`br-owner-nav__item${isActive ? " br-owner-nav__item--active" : ""}`}
              >
                <span aria-hidden="true">{item.icon}</span>
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
            <p>Следите за объектами, календарем занятости и заявками в одном месте.</p>
          </div>
          <div className="br-owner-topbar__actions">
            <span className="br-owner-topbar__chip">Bronly</span>
            <Link className="br-icon-link" href={notificationsHref} aria-label="Уведомления">
              <span aria-hidden="true">⎃</span>
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
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`br-owner-bottom-nav__item${isActive ? " br-owner-bottom-nav__item--active" : ""}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
