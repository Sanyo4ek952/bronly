"use client";

import { Copy, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { OwnerInventoryDashboardItem } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { formatRubles } from "@/shared/lib/money";

import { AgentCollaborationToggle } from "./agent-collaboration-toggle";
import { inventoryMenuButtonClass, inventoryMenuListClass } from "./property-inventory-ui";
import { PropertyQuickActions } from "./property-quick-actions";
import { PropertyStatusBadge } from "./property-status-badge";

type PropertyCardProps = { item: OwnerInventoryDashboardItem };

function getItemHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}/rooms` : `/dashboard/rooms/${item.id}`;
}

function getSettingsHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}` : `/dashboard/rooms/${item.id}/settings`;
}

function getMenuLinks(item: OwnerInventoryDashboardItem) {
  const settingsHref = getSettingsHref(item);
  return [
    { href: settingsHref, label: "Настройки" },
    { href: getItemHref(item), label: item.kind === "property" ? "Номера объекта" : "Открыть номер" },
    { href: item.publicHref ?? settingsHref, label: item.publicHref ? "Публичная страница" : "Настройки профиля", external: Boolean(item.publicHref) },
  ];
}

function formatRoomRatio(item: OwnerInventoryDashboardItem) {
  return `${item.roomCount} / ${item.activeRoomCount}`;
}

function formatPrice(value: number | null) {
  return value == null ? "—" : `от ${formatRubles(value)}`;
}

export function PropertyCard({ item }: PropertyCardProps) {
  const [copied, setCopied] = useState(false);
  const metaLabel = item.kind === "property" ? item.propertyType : `${item.propertyType} · Отдельный номер`;

  async function handleCopy() {
    if (!item.publicHref) return;
    await navigator.clipboard.writeText(`${window.location.origin}${item.publicHref}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const metrics = [
    { label: item.kind === "property" ? "номера / активны" : "номер / активен", value: formatRoomRatio(item) },
    { label: "за сутки", value: formatPrice(item.minPrice) },
    { label: "новые заявки", value: String(item.newRequestsCount) },
    { label: "активность", value: `${item.activityScore}%` },
  ];

  return (
    <article className="grid grid-cols-[154px_minmax(0,1fr)] gap-[17px] rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)] max-[720px]:grid-cols-1 max-[720px]:gap-3 max-[720px]:p-2.5">
      <Link
        href={getItemHref(item)}
        className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,var(--surface-muted),var(--surface-subtle))] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.16)] max-[720px]:min-h-[154px] max-[350px]:min-h-[132px]"
      >
        {item.coverImageUrl ? (
          <Image src={item.coverImageUrl} alt={item.title} width={960} height={640} unoptimized sizes="(min-width: 1080px) 154px, 100vw" className="h-full w-full object-cover" />
        ) : <span className="block h-full w-full" aria-hidden="true" />}
      </Link>

      <div className="grid min-w-0 content-start">
        <div className="flex items-start justify-between gap-4 px-1 pb-3 pt-1 max-[520px]:grid max-[520px]:gap-2">
          <div className="min-w-0">
            <h3 className="text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)] max-[520px]:text-xl">{item.title}</h3>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">{[metaLabel, item.city].filter(Boolean).join(" · ")}</p>
            {item.address ? <p className="mt-1 text-xs text-[var(--text-subtle)]">{item.address}</p> : null}
          </div>
          <PropertyStatusBadge status={item.status} label={item.statusLabel} />
        </div>

        <dl className="grid grid-cols-4 border-y border-[var(--border)] max-[520px]:grid-cols-2">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={cn("border-r border-[var(--border)] px-3 py-2.5 last:border-r-0 max-[520px]:border-b max-[520px]:px-1.5", index % 2 === 1 && "max-[520px]:border-r-0", index >= 2 && "max-[520px]:border-b-0")}>
              <dt className="text-[10px] text-[var(--text-muted)]">{metric.label}</dt>
              <dd className="mt-1 text-sm font-bold text-[var(--text)]">{metric.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-1 py-2.5 max-[720px]:grid max-[720px]:gap-2.5">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[10px] text-[var(--text-muted)]">Публичная ссылка</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--accent-strong)]">{item.publicLabel ?? "Сначала заполните публичный профиль"}</strong>
              <button type="button" className="grid size-7 flex-none place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)] disabled:cursor-not-allowed disabled:opacity-50" disabled={!item.publicHref} aria-label={copied ? "Скопировано" : `Копировать публичную ссылку ${item.title}`} onClick={() => void handleCopy()}>
                <Copy aria-hidden="true" className="size-4" strokeWidth={1.9} />
              </button>
              <span className="sr-only" aria-live="polite">{copied ? "Ссылка скопирована" : ""}</span>
            </span>
          </div>
          <AgentCollaborationToggle targetId={item.id} targetKind={item.kind} checked={item.allowAgentInquiries} activeCollaborationsCount={item.activeCollaborationsCount} itemTitle={item.title} />
        </div>

        <div className="flex items-stretch gap-2 px-1 pb-0.5 pt-2.5 max-[520px]:gap-1.5">
          <PropertyQuickActions item={item} />
          <details className="relative flex-none">
            <summary className={cn(inventoryMenuButtonClass, "list-none cursor-pointer [&::-webkit-details-marker]:hidden")} aria-label={`Действия для ${item.title}`}>
              <MoreHorizontal aria-hidden="true" className="size-[18px]" strokeWidth={1.9} />
            </summary>
            <div className={inventoryMenuListClass}>
              {getMenuLinks(item).map((link) => (
                <Link key={link.label} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined} className="rounded-xl px-3 py-2.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.14)]">{link.label}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}
