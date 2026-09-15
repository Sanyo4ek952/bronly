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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutAction } from "@/features/auth/sign-out-action";
import { cn } from "@/shared/lib/cn";
import { AppIcon, BottomSheet, BrandLogo, Button, type AppIconComponent } from "@/shared/ui";

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

function getNavigationItemClass(isActive: boolean, surface: "sidebar" | "bottom" | "sheet") {
  return cn(
    "inline-flex items-center font-bold text-[var(--text-muted)] transition-[background-color,color,box-shadow] duration-[180ms]",
    "hover:bg-[rgb(var(--color-primary-rgb)_/_0.06)] hover:text-[var(--text)]",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
    surface === "sidebar" && "min-h-11 gap-2.5 rounded-[14px] px-3.5",
    surface === "bottom" && cn(
      "min-h-[52px] justify-center gap-2 px-1 py-2 text-center text-[11px]",
      "max-[390px]:min-h-[46px] max-[390px]:gap-1.5 max-[390px]:px-0.5 max-[390px]:py-1.5 max-[390px]:text-[10px]",
    ),
    surface === "sheet" && "min-h-11 gap-2.5 rounded-[14px] px-3.5",
    isActive && "bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--accent-strong)]",
  );
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

  return (
    <div className="grid w-full grid-cols-[minmax(248px,280px)_minmax(0,1fr)] items-start gap-[18px] max-[1080px]:grid-cols-1">
      <aside className="sticky top-5 grid gap-[18px] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-sm)] max-[1080px]:hidden">
        <div className="pb-0.5">
          <BrandLogo />
        </div>

        <div className="grid gap-2">
          <span className="inline-flex min-h-[34px] items-center gap-2 justify-self-start rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.08)] px-3 text-xs font-bold text-[var(--accent-strong)]">
            <AppIcon icon={ShieldCheck} className="size-[18px]" aria-hidden="true" />
            <span>Администратор</span>
          </span>
          <strong>{userName}</strong>
          <p className="text-[var(--text-muted)]">Управление подписками, модерацией и внутренними проверками Bronly.</p>
        </div>

        <nav className="grid gap-3.5" aria-label="Навигация администратора">
          {navigationItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={getNavigationItemClass(isActive, "sidebar")}
                aria-current={isActive ? "page" : undefined}
              >
                <AppIcon icon={item.icon} className="size-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <form action={signOutAction}>
          <Button className="justify-start" variant="ghost" fullWidth type="submit">
            Выйти
          </Button>
        </form>
      </aside>

      <div className="grid min-w-0 gap-3.5 pb-[calc(88px+var(--safe-area-bottom))]">
        {children}

        <nav className="fixed inset-x-3.5 bottom-0 z-30 hidden grid-cols-4 gap-2 rounded-t-[18px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.96)] p-2 pb-[calc(8px+var(--safe-area-bottom))] shadow-[var(--shadow-md)] backdrop-blur-xl max-[1080px]:grid max-[390px]:inset-x-2.5 max-[390px]:gap-1.5 max-[390px]:p-1.5 max-[390px]:pb-[calc(6px+var(--safe-area-bottom))]" aria-label="Мобильная навигация администратора">
          {mobilePrimaryItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={getNavigationItemClass(isActive, "bottom")}
                aria-current={isActive ? "page" : undefined}
              >
                <AppIcon icon={item.icon} className="size-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={getNavigationItemClass(isMobileMenuOpen || isOverflowActive, "bottom")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="admin-mobile-menu"
            aria-label="Ещё"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <AppIcon icon={Menu} className="size-[18px]" aria-hidden="true" />
            <span>Ещё</span>
          </button>
        </nav>

        <BottomSheet
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
          dialogId="admin-mobile-menu"
          titleId="admin-mobile-sheet-title"
          title="Ещё"
          description="Быстрый доступ к пользователям и объектам."
          closeLabel="Закрыть"
          bodyClassName="gap-2"
        >
          {({ close }) => (
            <>
              {overflowItems.map((item) => {
                const isActive = isItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={getNavigationItemClass(isActive, "sheet")}
                    aria-current={isActive ? "page" : undefined}
                    onClick={close}
                  >
                    <AppIcon icon={item.icon} className="size-[18px]" aria-hidden="true" />
                    <span>{item.label}</span>
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
