import Image from "next/image";
import Link from "next/link";

import type { OwnerPropertyDetail } from "@/entities/property";
import { cn } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui";

import { ObjectStats } from "./object-stats";
import { StatusBadge } from "./status-badge";

type ObjectSummaryCardProps = {
  property: OwnerPropertyDetail;
  busyRangeCount: number;
  roomsHref: string;
  calendarHref: string;
  publicHref: string;
  compact?: boolean;
  className?: string;
};

export function ObjectSummaryCard({
  property,
  busyRangeCount,
  roomsHref,
  calendarHref,
  publicHref,
  compact = false,
  className,
}: ObjectSummaryCardProps) {
  return (
    <section className={cn("br-object-summary-card br-card", compact && "br-object-summary-card--compact", className)}>
      <div className="br-object-summary-card__media">
        {property.coverImageUrl ? (
          <Image
            src={property.coverImageUrl}
            alt={property.title}
            width={1200}
            height={760}
            unoptimized
            className="br-object-summary-card__image"
          />
        ) : (
          <div className="br-object-summary-card__placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="br-object-summary-card__copy">
        <div className="br-object-summary-card__top">
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
          <span className="br-object-summary-card__type">{property.propertyType}</span>
        </div>

        <div>
          <h2>{property.title}</h2>
          <p>{[property.city, property.address].filter(Boolean).join(", ")}</p>
        </div>

        <ObjectStats
          items={[
            { label: "Номера", value: String(property.rooms.length) },
            { label: "Активные", value: String(property.rooms.filter((room) => room.isActive).length) },
            { label: "Занятые даты", value: String(busyRangeCount), tone: "accent" },
          ]}
        />

        <div className="br-object-summary-card__quick-links">
          <Link href={roomsHref}>Перейти к номерам</Link>
          <Link href={calendarHref}>Перейти к календарю</Link>
          <Link href={publicHref}>Открыть публичную страницу</Link>
        </div>

        <div className="br-object-summary-card__hints">
          {!property.photos.length ? <p>Добавьте больше фото, чтобы карточка выглядела убедительнее.</p> : null}
          {!property.phone && !property.whatsapp && !property.telegram ? <p>Заполните контакты для быстрой связи.</p> : null}
          {!property.houseRules.length ? <p>Укажите правила проживания, чтобы снизить количество уточнений.</p> : null}
        </div>

        <div className="br-object-summary-card__actions">
          <ButtonLink href={roomsHref} variant="secondary" fullWidth>
            Номера
          </ButtonLink>
          <ButtonLink href={calendarHref} variant="secondary" fullWidth>
            Календарь
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
