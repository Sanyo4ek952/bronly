"use client";

import { Bell, LogOut } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/features/auth/sign-out-action";
import { AppIcon, IconButton } from "@/shared/ui";

export type DashboardTopbarProps = {
  title: string;
  description: string;
  notificationsHref: string;
  unreadNotificationsCount?: number;
};

export function DashboardTopbar({
  title,
  description,
  notificationsHref,
  unreadNotificationsCount = 0,
}: DashboardTopbarProps) {
  const badgeLabel = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  return (
    <header className="flex items-start justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px] max-[640px]:flex-col">
      <div className="min-w-0">
        <h1 className="text-[var(--title-size)] leading-[1.04] tracking-[-0.04em] text-[var(--text)]">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="flex flex-none items-center gap-2.5">
        <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">Bronly</span>
        <Link
          className="relative grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
          href={notificationsHref}
          aria-label="Уведомления"
        >
          <AppIcon icon={Bell} aria-hidden="true" />
          {unreadNotificationsCount > 0 ? (
            <span className="absolute right-1 top-1 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--color-danger)] px-1 text-[9px] font-extrabold leading-none text-white">{badgeLabel}</span>
          ) : null}
        </Link>
        <form action={signOutAction}>
          <IconButton type="submit" aria-label="Выйти">
            <AppIcon icon={LogOut} aria-hidden="true" />
          </IconButton>
        </form>
      </div>
    </header>
  );
}
