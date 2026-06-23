"use client";

import { BedDouble, Copy, Mail, MoreHorizontal, Tag, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { OwnerInventoryDashboardItem } from "@/entities/property";
import { AppIcon } from "@/shared/ui";

import { AgentCollaborationToggle } from "./agent-collaboration-toggle";
import { PropertyQuickActions } from "./property-quick-actions";
import { PropertyStatusBadge } from "./property-status-badge";

type PropertyCardProps = {
  item: OwnerInventoryDashboardItem;
};

function formatMoney(value: number | null) {
  if (value == null) {
    return "—";
  }

  return `от ${value.toLocaleString("ru-RU")} ₽`;
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
    <article className="br-property-hub-card br-card">
      <Link href={getItemHref(item)} className="br-property-hub-card__media">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            width={960}
            height={640}
            unoptimized
            sizes="(min-width: 1280px) 20vw, (min-width: 900px) 30vw, 100vw"
            className="br-property-hub-card__image"
          />
        ) : (
          <div className="br-property-hub-card__placeholder" aria-hidden="true" />
        )}
      </Link>

      <div className="br-property-hub-card__head">
        <div className="br-property-hub-card__heading">
          <div className="br-property-hub-card__title-row">
            <strong>{item.title}</strong>
          </div>
          <div className="br-property-hub-card__subline">
            <span>{metaLabel}</span>
            {item.city ? (
              <>
                <span className="br-property-hub-card__dot" aria-hidden="true" />
                <span>{item.city}</span>
              </>
            ) : null}
          </div>
        </div>
        <PropertyStatusBadge status={item.status} label={item.statusLabel} />
      </div>

      <div className="br-property-hub-card__stats">
        <div className="br-property-hub-card__stat">
          <div className="br-property-hub-card__stat-icon">
            <AppIcon icon={BedDouble} aria-hidden="true" />
          </div>
          <div className="br-property-hub-card__stat-body">
            <div className="br-property-hub-card__stat-head">
              <span>Номеров</span>
            </div>
            <div className="br-property-hub-card__stat-value">
              <strong>{item.roomCount}</strong>
            </div>
          </div>
        </div>

        <div className="br-property-hub-card__stat">
          <div className="br-property-hub-card__stat-icon">
            <AppIcon icon={Mail} aria-hidden="true" />
          </div>
          <div className="br-property-hub-card__stat-body">
            <div className="br-property-hub-card__stat-head">
              <span>Новые заявки</span>
            </div>
            <div className="br-property-hub-card__stat-value">
              <strong>{item.newRequestsCount}</strong>
            </div>
          </div>
        </div>

        <div className="br-property-hub-card__stat">
          <div className="br-property-hub-card__stat-icon">
            <AppIcon icon={Tag} aria-hidden="true" />
          </div>
          <div className="br-property-hub-card__stat-body">
            <div className="br-property-hub-card__stat-head">
              <span>Цена от</span>
            </div>
            <div className="br-property-hub-card__stat-value">
              <strong>{formatMoney(item.minPrice)}</strong>
            </div>
          </div>
        </div>

        <div className="br-property-hub-card__stat br-property-hub-card__stat--activity">
          <div className="br-property-hub-card__stat-icon">
            <AppIcon icon={TrendingUp} aria-hidden="true" />
          </div>
          <div className="br-property-hub-card__stat-body">
            <div className="br-property-hub-card__stat-head">
              <span>Активность</span>
            </div>
            <div className="br-property-hub-card__stat-value">
              <strong>{item.activityScore}%</strong>
              <span className="br-property-hub-card__trend" aria-hidden="true">
                <svg viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <div className="br-property-hub-card__link-row">
        <div className="br-property-hub-card__link-copy">
          <span>Публичная ссылка</span>
          <div className="br-property-hub-card__link-inline">
            <strong>{item.publicLabel ?? "Сначала заполните публичный профиль"}</strong>
            <button
              type="button"
              className="br-property-hub-card__copy"
              disabled={!item.publicHref}
              aria-label={copied ? "Скопировано" : "Копировать публичную ссылку"}
              title={copied ? "Скопировано" : "Копировать публичную ссылку"}
              onClick={() => void handleCopy()}
            >
              <AppIcon icon={Copy} aria-hidden="true" />
              <span>{copied ? "Скопировано" : "Копировать"}</span>
            </button>
          </div>
        </div>

        <AgentCollaborationToggle
          targetId={item.id}
          targetKind={item.kind}
          checked={item.allowAgentInquiries}
        />
      </div>

      <div className="br-property-hub-card__footer">
        <div className="br-property-hub-card__footer-bottom">
          <PropertyQuickActions item={item} />

          <details className="br-property-hub-card__menu br-property-hub-card__menu--footer">
            <summary aria-label={`Действия для ${item.title}`}>
              <AppIcon icon={MoreHorizontal} aria-hidden="true" />
            </summary>
            <div className="br-property-hub-card__menu-list">
              {menuLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
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
