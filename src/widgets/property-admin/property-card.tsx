"use client";

import { BedDouble, Copy, Mail, MoreHorizontal, Tag, TrendingUp } from "lucide-react";
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

type PropertyCardProps = {
  item: OwnerInventoryDashboardItem;
};

function formatMoney(value: number | null) {
  if (value == null) {
    return "—";
  }

  return `от ${formatRubles(value)}`;
}

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
    {
      href: item.publicHref ?? settingsHref,
      label: item.publicHref ? "Публичная страница" : "Настройки профиля",
      external: Boolean(item.publicHref),
    },
  ];
}

const statClass = cn(
  "grid min-h-[74px] items-center gap-2.5 border-l border-[rgb(16_24_40_/_0.08)] px-4 py-[14px]",
  "[grid-template-columns:28px_minmax(0,1fr)] first:border-l-0",
  "max-[520px]:min-h-[54px] max-[520px]:border-l-0 max-[520px]:px-1.5 max-[520px]:py-2.5",
  "max-[520px]:[grid-template-columns:22px_minmax(0,1fr)]",
);

export function PropertyCard({ item }: PropertyCardProps) {
  const [copied, setCopied] = useState(false);
  const metaLabel = item.kind === "property" ? item.propertyType : `${item.propertyType} • Отдельный номер`;
  const menuLinks = getMenuLinks(item);

  async function handleCopy() {
    if (!item.publicHref) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${item.publicHref}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article
      className={cn(
        "grid overflow-hidden rounded-3xl border border-[rgb(16_24_40_/_0.08)] bg-white p-3 [box-shadow:0_10px_28px_rgb(16_24_40_/_0.06)]",
        "[grid-template-areas:'media_head'_'media_stats'_'media_link'_'media_footer'] [grid-template-columns:168px_minmax(0,1fr)] gap-x-[18px] gap-y-[14px]",
        "max-[960px]:[grid-template-columns:144px_minmax(0,1fr)] max-[960px]:gap-x-4 max-[960px]:gap-y-3",
        "max-[720px]:[grid-template-columns:128px_minmax(0,1fr)] max-[720px]:p-2.5 max-[720px]:gap-x-[14px] max-[720px]:gap-y-3",
        "max-[520px]:rounded-[20px] max-[520px]:p-2.5 max-[520px]:gap-x-3 max-[520px]:gap-y-2.5",
        "max-[520px]:[grid-template-areas:'media_head'_'stats_stats'_'link_link'_'footer_footer'] max-[520px]:[grid-template-columns:94px_minmax(0,1fr)]",
      )}
    >
      <Link
        href={getItemHref(item)}
        className={cn(
          "relative block min-h-[250px] overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#d6ebe7_0%,#b4d7d5_40%,#f0e4d2_100%)] [grid-area:media]",
          "max-[960px]:min-h-[208px] max-[720px]:min-h-[176px] max-[520px]:min-h-[86px] max-[520px]:rounded-[14px]",
        )}
      >
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            width={960}
            height={640}
            unoptimized
            sizes="(min-width: 1280px) 20vw, (min-width: 900px) 30vw, 100vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-[linear-gradient(135deg,#bfdde3_0%,#d9e5dc_52%,#ece1d5_100%)]"
            aria-hidden="true"
          />
        )}
      </Link>

      <div className="flex min-w-0 items-start justify-between gap-3 pt-1 [grid-area:head] max-[520px]:pt-0.5">
        <div className="grid min-w-0 flex-1 gap-2.5 max-[520px]:gap-2">
          <div className="flex items-start gap-3 max-[720px]:flex-wrap max-[520px]:grid max-[520px]:gap-2">
            <strong className="block text-[clamp(22px,2vw,34px)] leading-[1.12] tracking-[-0.02em] text-[var(--text)]">
              {item.title}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm leading-[1.3] text-[var(--text-subtle)]">
            <span>{metaLabel}</span>
            {item.city ? (
              <>
                <span className="h-[5px] w-[5px] rounded-full bg-[rgb(16_24_40_/_0.24)]" aria-hidden="true" />
                <span>{item.city}</span>
              </>
            ) : null}
          </div>
        </div>

        <PropertyStatusBadge status={item.status} label={item.statusLabel} />
      </div>

      <div className="grid grid-cols-4 items-stretch border-y border-[rgb(16_24_40_/_0.08)] [grid-area:stats] max-[520px]:grid-cols-3 max-[520px]:border-t-0">
        <div className={statClass}>
          <div className="flex min-h-full items-center justify-center text-[var(--text-subtle)]">
            <BedDouble aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="grid min-w-0 gap-1">
            <div className="min-w-0 text-[var(--text-muted)]">
              <span className="block text-xs leading-[1.2] max-[520px]:text-[11px]">Номеров</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <strong className="min-w-0 text-[15px] leading-[1.2] tracking-[-0.01em] text-[var(--text)] max-[520px]:text-base">
                {item.roomCount}
              </strong>
            </div>
          </div>
        </div>

        <div className={statClass}>
          <div className="flex min-h-full items-center justify-center text-[var(--text-subtle)]">
            <Mail aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="grid min-w-0 gap-1">
            <div className="min-w-0 text-[var(--text-muted)]">
              <span className="block text-xs leading-[1.2] max-[520px]:text-[11px]">Новые заявки</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <strong className="min-w-0 text-[15px] leading-[1.2] tracking-[-0.01em] text-[var(--text)] max-[520px]:text-base">
                {item.newRequestsCount}
              </strong>
            </div>
          </div>
        </div>

        <div className={statClass}>
          <div className="flex min-h-full items-center justify-center text-[var(--text-subtle)]">
            <Tag aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="grid min-w-0 gap-1">
            <div className="min-w-0 text-[var(--text-muted)]">
              <span className="block text-xs leading-[1.2] max-[520px]:text-[11px]">Цена от</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <strong className="min-w-0 text-[15px] leading-[1.2] tracking-[-0.01em] text-[var(--text)] max-[520px]:text-base">
                {formatMoney(item.minPrice)}
              </strong>
            </div>
          </div>
        </div>

        <div className={cn(statClass, "max-[520px]:col-span-3 max-[520px]:border-t max-[520px]:px-0")}>
          <div className="flex min-h-full items-center justify-center text-[var(--text-subtle)]">
            <TrendingUp aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="grid min-w-0 gap-1">
            <div className="min-w-0 text-[var(--text-muted)]">
              <span className="block text-xs leading-[1.2] max-[520px]:text-[11px]">Активность</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <strong className="min-w-0 text-[15px] leading-[1.2] tracking-[-0.01em] text-[var(--text)] max-[520px]:text-base">
                {item.activityScore}%
              </strong>
              <span className="inline-flex h-[18px] w-11 text-[#39a95a] max-[520px]:w-10" aria-hidden="true">
                <svg viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path
                    d="M1.5 13.5L8.5 11L14 15.5L21 5.5L28 8.5L34.5 7L42.5 2.5"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-4 border-b border-[rgb(16_24_40_/_0.08)] pt-0.5 [grid-area:link] max-[520px]:grid max-[520px]:gap-2">
        <div className="grid min-w-0 flex-1 justify-items-start gap-0.5">
          <span className="text-[11px] leading-[1.2] text-[rgb(16_24_40_/_0.56)]">Публичная ссылка</span>
          <div className="inline-flex min-w-0 max-w-full items-center gap-1 max-[520px]:gap-1.5">
            <strong className="inline-block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-[1.2] text-[var(--color-primary-hover)] min-[521px]:max-w-[520px]">
              {item.publicLabel ?? "Сначала заполните публичный профиль"}
            </strong>
            <button
              type="button"
              className={cn(
                "inline-flex size-[22px] min-h-[22px] min-w-[22px] flex-none items-center justify-center rounded-md border-0 bg-transparent p-0 font-semibold text-[rgb(16_24_40_/_0.64)]",
                "transition-[background-color,color,transform] duration-[180ms] hover:bg-[var(--color-primary-pale)] hover:text-[var(--color-primary-hover)]",
                "disabled:cursor-not-allowed disabled:opacity-55 max-[520px]:size-6 max-[520px]:min-h-6 max-[520px]:min-w-6",
              )}
              disabled={!item.publicHref}
              aria-label={copied ? "Скопировано" : "Копировать публичную ссылку"}
              title={copied ? "Скопировано" : "Копировать публичную ссылку"}
              onClick={() => void handleCopy()}
            >
              <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
              <span className="sr-only">{copied ? "Скопировано" : "Копировать"}</span>
            </button>
          </div>
        </div>

        <AgentCollaborationToggle
          targetId={item.id}
          targetKind={item.kind}
          checked={item.allowAgentInquiries}
        />
      </div>

      <div className="grid gap-2.5 [grid-area:footer]">
        <div className="flex items-stretch justify-between gap-3 max-[520px]:gap-2">
          <PropertyQuickActions item={item} />

          <details className="relative">
            <summary
              className={cn(
                inventoryMenuButtonClass,
                "list-none cursor-pointer text-[var(--text-subtle)] [&::-webkit-details-marker]:hidden",
                "max-[520px]:size-[54px] max-[520px]:min-h-[54px] max-[520px]:min-w-[54px]",
              )}
              aria-label={`Действия для ${item.title}`}
            >
              <MoreHorizontal aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </summary>
            <div className={inventoryMenuListClass}>
              {menuLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="rounded-xl px-3 py-2.5 text-sm text-[var(--text)] transition-colors duration-[180ms] hover:bg-[var(--color-primary-pale)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}
