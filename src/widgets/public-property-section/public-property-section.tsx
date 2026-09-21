import Image from "next/image";
import Link from "next/link";
import { Building2, ImageIcon } from "lucide-react";

import type { PublicPropertySummary } from "@/entities/property";
import { sortPublicProperties, summarizePublicProperty, type PublicBrowseSection } from "@/entities/property/model/public-browse";
import type { PublicStayFilters } from "@/entities/room";
import { formatRubles, getRussianPluralForm } from "@/shared/lib";
import { buildPublicDetailHref } from "@/shared/lib/public-links";
import { AppIcon } from "@/shared/ui";
import { ExpandableText } from "@/shared/ui/expandable-text";
import { RoomPhotoCarousel } from "@/widgets/room-detail-page/room-photo-carousel";

type PublicPropertySectionProps = PublicBrowseSection & {
  publicBaseHref: string;
  filters: PublicStayFilters;
};

export function PublicPropertySection({ publicBaseHref, property, rooms, filters, sourceKinds }: PublicPropertySectionProps) {
  const summary = summarizePublicProperty(rooms, filters);
  const partialCollection = sourceKinds && !sourceKinds.includes("property");
  const roomCount = `${summary.roomCount} ${getRussianPluralForm(summary.roomCount, ["номер", "номера", "номеров"])}${partialCollection ? " в подборке" : ""}`;

  return (
    <Link
      href={buildPublicDetailHref(publicBaseHref, "properties", property.id, filters)}
      className="group grid min-w-0 gap-4 rounded-[var(--radius-sm)] py-5 transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
      aria-label={`Об объекте и номерах: ${property.shortTitle}`}
    >
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] sm:aspect-[3/2]">
        {property.photos[0] ? <Image src={property.photos[0].url} alt={property.title} width={720} height={480} unoptimized className="h-full w-full object-cover" /> : <AppIcon icon={ImageIcon} className="size-10 text-[var(--text-muted)]" aria-label="Нет фото" />}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="grid min-w-0 gap-2.5">
          <h3 className="text-lg font-bold leading-tight [overflow-wrap:anywhere]">{property.shortTitle}</h3>
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)] [overflow-wrap:anywhere]">{[property.city, property.address].filter(Boolean).join(", ")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <AppIcon icon={Building2} className="size-4" aria-hidden="true" />
            <span>{property.propertyType || "Объект"}</span><span>·</span><span>{roomCount}</span>
          </div>
          {property.features.length ? <p className="text-sm text-[var(--text-muted)] [overflow-wrap:anywhere]">{property.features.slice(0, 4).join(" · ")}{property.features.length > 4 ? ` · ещё ${property.features.length - 4}` : ""}</p> : null}
          <p className={`text-sm ${summary.suitableCount ? "text-[var(--text-muted)]" : "text-[var(--color-warning-ink)]"}`}>
            {!summary.roomCount ? "Пока нет опубликованных номеров" : summary.suitableCount ? `Подходит ${summary.suitableCount} из ${summary.roomCount}` : "Нет номеров по выбранным параметрам — можно посмотреть объект и изменить поиск"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pr-3 lg:grid lg:min-w-44 lg:justify-items-end">
          {summary.minPrice != null ? <strong className="text-lg font-extrabold">от {formatRubles(Math.round(summary.minPrice))}{filters.hasDates ? " за весь период" : " / ночь"}</strong> : null}
          <span className="inline-flex min-h-11 items-center font-semibold text-[var(--accent)] group-hover:underline">Об объекте и номерах →</span>
        </div>
      </div>
    </Link>
  );
}

export function PublicPropertyBrowser({ sections, ...props }: { sections: PublicBrowseSection[]; publicBaseHref: string; filters: PublicStayFilters }) {
  return <div className="grid divide-y divide-[var(--border)] border-y border-[var(--border)]">{sortPublicProperties(sections).map((section) => <PublicPropertySection key={section.property.id} {...section} {...props} />)}</div>;
}

export function PublicPropertyDetails({ property, showGallery = true }: { property: PublicPropertySummary; showGallery?: boolean }) {
  return (
    <div className="grid min-w-0 gap-6">
      {showGallery ? <RoomPhotoCarousel variant="public" photos={property.photos} roomTitle={property.title} /> : null}
      <div className="grid gap-2">
        <p className="text-sm text-[var(--text-muted)]">{[property.propertyType, property.city, property.address].filter(Boolean).join(" · ")}</p>
        <ExpandableText text={[...new Set([property.shortDescription.trim(), property.fullDescription.trim()].filter(Boolean))].join("\n\n")} />
      </div>
      <PublicDetailList title="Удобства объекта" items={property.features} />
      <PublicDetailList title="Правила проживания" items={property.houseRules} />
      <PublicCheckInTimes checkIn={property.checkInTime} checkOut={property.checkOutTime} />
    </div>
  );
}

export function PublicDetailList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section className="grid gap-3"><h2 className="text-xl font-bold">{title}</h2><ul className="flex flex-wrap gap-2">{items.map((item, index) => <li key={`${item}-${index}`} className="rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] px-3 py-2 text-sm">{item}</li>)}</ul></section>;
}

export function PublicCheckInTimes({ checkIn, checkOut }: { checkIn?: string; checkOut?: string }) {
  if (!checkIn && !checkOut) return null;
  return <div className="flex flex-wrap gap-5 text-sm text-[var(--text-muted)]">{checkIn ? <p>Заезд: {checkIn}</p> : null}{checkOut ? <p>Выезд: {checkOut}</p> : null}</div>;
}
