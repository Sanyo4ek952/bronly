import { MoreHorizontal, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { OwnerPropertyListItem, OwnerStandaloneRoomListItem } from "@/entities/property";
import { AppIcon, ButtonLink } from "@/shared/ui";

import { ObjectStats } from "./object-stats";
import { StatusBadge } from "./status-badge";

type ObjectCardProps =
  | {
      item: OwnerPropertyListItem;
    }
  | {
      item: OwnerStandaloneRoomListItem;
    };

export function ObjectCard({ item }: ObjectCardProps) {
  const isProperty = item.kind !== "standalone_room";
  const href = isProperty ? `/dashboard/properties/${item.id}/rooms` : `/dashboard/rooms/${item.id}`;
  const settingsHref = isProperty ? `/dashboard/properties/${item.id}` : `/dashboard/rooms/${item.id}/settings`;
  const secondaryHref = item.ownerPublicSlug ? `/p/${item.ownerPublicSlug}` : "/dashboard/settings";
  const stats = isProperty
    ? [
        { label: "Номера", value: String(item.roomCount) },
        { label: "Активные", value: String(item.activeRoomCount) },
        { label: "Занятые даты", value: String(item.busyRangeCount), tone: "accent" as const },
      ]
    : [
        { label: "Тип", value: item.propertyType || "Номер" },
        { label: "Цена", value: `${Math.round(item.pricePerNight).toLocaleString("ru-RU")} ₽` },
        { label: "Занятые даты", value: String(item.busyRangeCount), tone: "accent" as const },
      ];

  return (
    <article className="br-object-card br-card">
      <Link href={href} className="br-object-card__media">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            width={960}
            height={640}
            sizes="(min-width: 1180px) 30vw, (min-width: 700px) 45vw, 100vw"
            unoptimized
            className="br-object-card__image"
          />
        ) : (
          <div className="br-object-card__placeholder" aria-hidden="true" />
        )}
      </Link>

      <div className="br-object-card__body">
        <div className="br-object-card__top">
          <StatusBadge
            {...(isProperty
              ? { kind: "property", published: item.published, isFrozen: item.isFrozen }
              : { kind: "room", isActive: item.isActive })}
          />
          <details className="br-object-card__menu">
            <summary aria-label={`Действия для ${item.title}`}>
              <AppIcon icon={MoreHorizontal} aria-hidden="true" />
            </summary>
            <div className="br-object-card__menu-list">
              <Link href={settingsHref}>Настройки</Link>
              <Link href={secondaryHref}>{item.ownerPublicSlug ? "Публичная ссылка" : "Настройки профиля"}</Link>
            </div>
          </details>
        </div>

        <div className="br-object-card__copy">
          <div>
            <strong>{item.title}</strong>
            <p>{isProperty ? item.propertyType : "Отдельный номер"}</p>
          </div>
          <Link href={settingsHref} className="br-object-card__icon-link" aria-label={`Открыть настройки ${item.title}`}>
            <AppIcon icon={Settings} aria-hidden="true" />
          </Link>
        </div>

        <p className="br-object-card__address">
          {[item.city, item.address].filter(Boolean).join(", ") || "Адрес пока не указан"}
        </p>

        <ObjectStats items={stats} compact />

        <div className="br-object-card__actions">
          <ButtonLink href={href} variant="secondary">
            {isProperty ? "Открыть объект" : "Открыть номер"}
          </ButtonLink>
          <ButtonLink href={secondaryHref} variant="ghost">
            {item.ownerPublicSlug ? "Публичная ссылка" : "Профиль"}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
