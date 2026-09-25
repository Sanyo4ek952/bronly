"use client";

import { Bell, LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/features/auth/sign-out-action";
import { AppIcon, ButtonLink, IconButton } from "@/shared/ui";

export type DashboardTopbarProps = {
  eyebrow?: string;
  title: string;
  description: string;
  notificationsHref: string;
  unreadNotificationsCount?: number;
  compact?: boolean;
};

export function DashboardTopbar({
  eyebrow,
  title,
  description,
  notificationsHref,
  unreadNotificationsCount = 0,
  compact = false,
}: DashboardTopbarProps) {
  const badgeLabel = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  if (compact) {
    return (
      <header className="flex items-center justify-between gap-6 max-[899px]:flex-col max-[899px]:items-stretch max-[899px]:gap-5">
        <div className="min-w-0">
          <h1 className="break-words text-[length:var(--title-size)] font-semibold leading-[1.25] tracking-[-0.025em]">{title}</h1>
          <p className="mt-2 text-sm leading-[1.5] text-[var(--text-muted)]">{description}</p>
        </div>
        <ButtonLink href="/dashboard/rooms/new" className="shrink-0">
          <AppIcon icon={Plus} className="!size-[18px]" strokeWidth={1.7} aria-hidden="true" />
          Добавить номер
        </ButtonLink>
      </header>
    );
  }

  return (
    <header className="flex items-start justify-between gap-5 px-1 py-2 max-[640px]:gap-3 max-[640px]:px-0">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-[10px] font-extrabold tracking-[0.11em] text-[var(--accent-strong)] sm:text-[11px]">{eyebrow}</p> : null}
        <h1 className="max-w-[48rem] break-words text-[clamp(1.85rem,3.2vw,2.85rem)] font-medium leading-[1.07] tracking-[-0.045em] text-[var(--text)]">{title}</h1>
        <p className="mt-2 max-w-[42rem] text-[13px] leading-[1.6] text-[var(--text-muted)] sm:text-sm">{description}</p>
      </div>
      <div className="flex flex-none items-center gap-2.5 max-[420px]:gap-1.5">
        <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--color-primary-hover)] max-[520px]:hidden">Bronly</span>
        <Link
          className="relative grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)] max-[420px]:size-9"
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
