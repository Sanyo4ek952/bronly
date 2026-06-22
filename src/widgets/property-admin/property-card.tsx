"use client";

import { Building2, Copy, MapPin, MoreHorizontal, Tag, Users } from "lucide-react";
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
  const location = [item.city, item.address].filter(Boolean).join(", ");
  const metaLabel = item.kind === "property" ? item.propertyType : `${item.propertyType} · Отдельный номер`;
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

      <div className="br-property-hub-card__content">
        <div className="br-property-hub-card__top">
          <div className="br-property-hub-card__heading">
            <div className="br-property-hub-card__title-row">
              <strong>{item.title}</strong>
              <PropertyStatusBadge status={item.status} label={item.statusLabel} />
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

          <details className="br-property-hub-card__menu">
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

        {location ? (
          <p className="br-property-hub-card__location">
            <AppIcon icon={MapPin} aria-hidden="true" />
            <span>{location}</span>
          </p>
        ) : null}

        <div className="br-property-hub-card__stats">
          <div className="br-property-hub-card__stat">
            <span>Номера</span>
            <strong>{item.roomCount}</strong>
          </div>
          <div className="br-property-hub-card__stat">
            <span>Новые заявки</span>
            <strong>{item.newRequestsCount}</strong>
          </div>
          <div className="br-property-hub-card__stat">
            <span>Цена</span>
            <strong>{formatMoney(item.minPrice)}</strong>
          </div>
          <div className="br-property-hub-card__stat">
            <span>Активность</span>
            <strong>{item.activityScore}%</strong>
          </div>
        </div>

        <div className="br-property-hub-card__link-row">
          <div className="br-property-hub-card__link-copy">
            <span>Публичная ссылка</span>
            <strong>{item.publicLabel ?? "Сначала заполните публичный профиль"}</strong>
          </div>
          <button
            type="button"
            className="br-property-hub-card__copy"
            disabled={!item.publicHref}
            onClick={() => void handleCopy()}
          >
            <AppIcon icon={Copy} aria-hidden="true" />
            <span>{copied ? "Скопировано" : "Копировать"}</span>
          </button>
        </div>

        <div className="br-property-hub-card__meta-strip">
          <div className="br-property-hub-card__meta-chip">
            <AppIcon icon={Building2} aria-hidden="true" />
            <span>Заполненность {item.completenessPercent}%</span>
          </div>
          <div className="br-property-hub-card__meta-chip">
            <AppIcon icon={Tag} aria-hidden="true" />
            <span>{item.activeRoomCount} активн.</span>
          </div>
          <div className="br-property-hub-card__meta-chip">
            <AppIcon icon={Users} aria-hidden="true" />
            <span>{item.activeCollaborationsCount} связей</span>
          </div>
        </div>

        <div className="br-property-hub-card__footer">
          <PropertyQuickActions item={item} />
          <AgentCollaborationToggle
            targetId={item.id}
            targetKind={item.kind}
            checked={item.allowAgentInquiries}
          />
        </div>
      </div>
    </article>
  );
}
