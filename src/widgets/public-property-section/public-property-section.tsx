import Image from "next/image";

import type { PublicPropertySummary } from "@/entities/property";
import { Panel, SectionSubtitle, SectionTitle } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicPropertySectionProps = {
  publicBaseHref: string;
  property: PublicPropertySummary;
  rooms: Parameters<typeof PublicRoomBrowser>[0]["rooms"];
  filters: Parameters<typeof PublicRoomBrowser>[0]["filters"];
  showFilter?: boolean;
  emptyRoomsText?: string;
  titleAs?: "h2" | "h3";
  layout?: "grid" | "list";
};

function PropertyTitle({ as, children, compact }: { as: "h2" | "h3"; children: string; compact?: boolean }) {
  return <SectionTitle as={as} className={compact ? "text-xl font-extrabold" : undefined}>{children}</SectionTitle>;
}

function PublicPropertyGallery({ property }: { property: PublicPropertySummary }) {
  if (!property.photos.length) {
    return <div className="min-h-[220px] rounded-[20px] bg-[linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]" aria-hidden="true" />;
  }

  return (
    <div className="grid auto-cols-[minmax(260px,76vw)] grid-flow-col gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label={`Галерея объекта ${property.shortTitle}`}>
      {property.photos.map((photo, index) => (
        <div key={photo.id} className="min-h-[220px] overflow-hidden rounded-[20px] bg-[var(--surface-subtle)]">
          <Image
            src={photo.url}
            alt={index === 0 ? property.title : `${property.title} — фото ${index + 1}`}
            width={1200}
            height={900}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function PropertyChipList({ title, items, compact }: { title: string; items: string[]; compact?: boolean }) {
  if (!items.length) {
    return null;
  }

  if (compact) {
    return <p className="text-sm leading-relaxed text-[var(--text-muted)]"><span className="font-semibold">{title}: </span>{items.join(" · ")}</p>;
  }

  return (
    <section className="grid gap-4">
      <h4 className="text-lg font-extrabold leading-tight">{title}</h4>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <span key={item} className="inline-flex min-h-9 items-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.88)] px-3 py-2 text-sm leading-snug">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function PublicPropertySection({
  publicBaseHref,
  property,
  rooms,
  filters,
  showFilter = false,
  emptyRoomsText = "По этому объекту пока нет активных номеров для заявки.",
  titleAs = "h3",
  layout = "grid",
}: PublicPropertySectionProps) {
  const addressLine = [property.city, property.address].filter(Boolean).join(", ");
  const hasDetailedMode = property.detailMode === "hospitality_detailed";
  const hasShortDescription = Boolean(property.shortDescription.trim());
  const hasFullDescription = Boolean(property.fullDescription.trim());
  const isList = layout === "list";
  const Container = isList ? "article" : Panel;

  return (
    <Container
      {...(!isList ? { as: "article" as const, surface: "raised" as const, padding: "lg" as const } : {})}
      className={isList ? "grid min-w-0 gap-3" : "grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]"}
    >
      <div>
        <div className={isList ? "flex flex-wrap items-baseline gap-x-4 gap-y-1" : "grid gap-1.5"}>
          <PropertyTitle as={titleAs} compact={isList}>{property.shortTitle}</PropertyTitle>
          <SectionSubtitle>{addressLine}</SectionSubtitle>
        </div>
      </div>

      {hasDetailedMode ? (
        <div className="grid gap-4">
          {!isList || property.photos.length > 0 ? <PublicPropertyGallery property={property} /> : null}

          <div className="grid gap-4 pt-1">
            <div className="grid gap-4">
              <div className={isList ? "text-sm text-[var(--text-muted)]" : "inline-flex min-h-8 w-fit items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]"}>{property.propertyType}</div>
              {hasShortDescription ? <p className="text-sm leading-relaxed text-[var(--color-muted)]">{property.shortDescription}</p> : null}
              {!hasShortDescription && hasFullDescription ? <p className="text-sm leading-relaxed text-[var(--color-muted)]">{property.fullDescription}</p> : null}
            </div>

            {hasShortDescription && hasFullDescription ? (
              <section className="grid gap-4">
                <h4 className="text-lg font-extrabold leading-tight">Описание объекта</h4>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">{property.fullDescription}</p>
              </section>
            ) : null}

            <PropertyChipList title="Что входит" items={property.features} compact={isList} />
            <PropertyChipList title="Удобства" items={property.aggregatedAmenities} compact={isList} />
            <PropertyChipList title="Правила" items={property.houseRules} compact={isList} />
          </div>
        </div>
      ) : null}

      {rooms.length ? (
        <PublicRoomBrowser
          publicBaseHref={publicBaseHref}
          propertySlug={property.slug}
          rooms={rooms}
          filters={filters}
          showFilter={showFilter}
          layout={layout}
        />
      ) : (
        isList ? <p className="border-t border-[var(--border)] py-5 text-sm text-[var(--text-muted)]">{emptyRoomsText}</p> : <Panel className="mt-4" surface="subtle" padding="md">
          {emptyRoomsText}
        </Panel>
      )}
    </Container>
  );
}
