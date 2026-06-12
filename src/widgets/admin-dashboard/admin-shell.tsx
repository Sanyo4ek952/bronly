"use client";

import {
  BellRing,
  Building2,
  CreditCard,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOutAction } from "@/app/auth/actions";
import { AppIcon, BrandLogo, Button, IconButton, type AppIconComponent } from "@/shared/ui";

type AdminNavigationItem = {
  href: string;
  label: string;
  icon: AppIconComponent;
};

const navigationItems: AdminNavigationItem[] = [
  { href: "/admin", label: "Сводка", icon: Home },
  { href: "/admin/reviews", label: "Проверки", icon: BellRing },
  { href: "/admin/subscriptions", label: "Подписки", icon: CreditCard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/properties", label: "Объекты", icon: Building2 },
];

const mobilePrimaryHrefs = ["/admin", "/admin/reviews", "/admin/subscriptions"] as const;

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

type AdminShellProps = {
  children: React.ReactNode;
  userName: string;
};

export function AdminShell({ children, userName }: AdminShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobilePrimaryItems = mobilePrimaryHrefs
    .map((href) => navigationItems.find((item) => item.href === href))
    .filter((item): item is AdminNavigationItem => Boolean(item));
  const overflowItems = navigationItems.filter(
    (item) => !mobilePrimaryItems.some((primaryItem) => primaryItem.href === item.href),
  );
  const isOverflowActive = overflowItems.some((item) => isItemActive(pathname, item.href));

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="br-admin-shell">
      <aside className="br-admin-sidebar br-card">
        <div className="br-admin-sidebar__brand">
          <BrandLogo />
        </div>

        <div className="br-admin-sidebar__intro">
          <span className="br-admin-sidebar__badge">
            <AppIcon icon={ShieldCheck} aria-hidden="true" />
            <span>Администратор</span>
          </span>
          <strong>{userName}</strong>
          <p>Управление подписками, модерацией и внутренними проверками Bronly.</p>
        </div>

        <nav className="br-admin-nav" aria-label="Навигация администратора">
          {navigationItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`br-admin-nav__item${isActive ? " br-admin-nav__item--active" : ""}`}
              >
                <AppIcon icon={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <form action={signOutAction}>
          <Button className="br-admin-signout" variant="ghost" fullWidth type="submit">
            Выйти
          </Button>
        </form>
      </aside>

      <div className="br-admin-shell__content">
        {children}

        <nav className="br-admin-bottom-nav br-card" aria-label="Мобильная навигация администратора">
          {mobilePrimaryItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`br-admin-bottom-nav__item${isActive ? " br-admin-bottom-nav__item--active" : ""}`}
              >
                <AppIcon icon={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={`br-admin-bottom-nav__item${isMobileMenuOpen || isOverflowActive ? " br-admin-bottom-nav__item--active" : ""}`}
            aria-expanded={isMobileMenuOpen}
            aria-controls="br-admin-mobile-menu"
            aria-label="Ещё"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <AppIcon icon={Menu} aria-hidden="true" />
            <span>Ещё</span>
          </button>
        </nav>

        {isMobileMenuOpen ? (
          <div className="br-admin-mobile-sheet-backdrop" role="presentation" onClick={() => setIsMobileMenuOpen(false)}>
            <section
              id="br-admin-mobile-menu"
              className="br-admin-mobile-sheet br-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="br-admin-mobile-sheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="br-admin-mobile-sheet__handle" aria-hidden="true" />
              <div className="br-admin-mobile-sheet__header">
                <div>
                  <h2 id="br-admin-mobile-sheet-title">Ещё</h2>
                  <p>Быстрый доступ к пользователям и объектам.</p>
                </div>
                <IconButton
                  type="button"
                  className="br-admin-mobile-sheet__close"
                  aria-label="Закрыть"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <AppIcon icon={X} aria-hidden="true" />
                </IconButton>
              </div>

              <div className="br-admin-mobile-sheet__list">
                {overflowItems.map((item) => {
                  const isActive = isItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`br-admin-mobile-sheet__item${isActive ? " br-admin-mobile-sheet__item--active" : ""}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <AppIcon icon={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <form action={signOutAction}>
                  <button type="submit" className="br-admin-mobile-sheet__item br-admin-mobile-sheet__item--button">
                    <AppIcon icon={LogOut} aria-hidden="true" />
                    <span>Выйти</span>
                  </button>
                </form>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
