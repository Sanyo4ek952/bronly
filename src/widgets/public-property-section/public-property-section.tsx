import Image from "next/image";

import type { PublicPropertySummary } from "@/entities/property";
import { SectionSubtitle, SectionTitle } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicPropertySectionProps = {
  publicBaseHref: string;
  property: PublicPropertySummary;
  rooms: Parameters<typeof PublicRoomBrowser>[0]["rooms"];
  filters: Parameters<typeof PublicRoomBrowser>[0]["filters"];
  showFilter?: boolean;
  emptyRoomsText?: string;
  titleAs?: "h2" | "h3";
};

function PropertyTitle({ as, children }: { as: "h2" | "h3"; children: string }) {
  return <SectionTitle as={as}>{children}</SectionTitle>;
}

function PublicPropertyGallery({ property }: { property: PublicPropertySummary }) {
  if (!property.photos.length) {
    return <div className="br-public-property-gallery__empty" aria-hidden="true" />;
  }

  return (
    <div className="br-public-property-gallery" aria-label={`Галерея объекта ${property.shortTitle}`}>
      {property.photos.map((photo, index) => (
        <div key={photo.id} className="br-public-property-gallery__item">
          <Image
            src={photo.url}
            alt={index === 0 ? property.title : `${property.title} — фото ${index + 1}`}
            width={1200}
            height={900}
            unoptimized
            className="br-public-property-gallery__image"
          />
        </div>
      ))}
    </div>
  );
}

function PropertyChipList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="br-public-property-detail__section">
      <h4>{title}</h4>
      <div className="br-public-property-detail__chips">
        {items.map((item) => (
          <span key={item} className="br-public-property-detail__chip">
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
}: PublicPropertySectionProps) {
  const addressLine = [property.city, property.address].filter(Boolean).join(", ");
  const hasDetailedMode = property.detailMode === "hospitality_detailed";
  const hasShortDescription = Boolean(property.shortDescription.trim());
  const hasFullDescription = Boolean(property.fullDescription.trim());

  return (
    <article className="br-public-property-section br-card br-card--raised">
      <div className="br-dashboard-block__header">
        <div className="br-section-copy">
          <PropertyTitle as={titleAs}>{property.shortTitle}</PropertyTitle>
          <SectionSubtitle>{addressLine}</SectionSubtitle>
        </div>
      </div>

      {hasDetailedMode ? (
        <div className="br-public-property-detail">
          <PublicPropertyGallery property={property} />

          <div className="br-public-property-detail__content">
            <div className="br-public-property-detail__intro">
              <div className="br-public-property-detail__eyebrow">{property.propertyType}</div>
              {hasShortDescription ? <p>{property.shortDescription}</p> : null}
              {!hasShortDescription && hasFullDescription ? <p>{property.fullDescription}</p> : null}
            </div>

            {hasShortDescription && hasFullDescription ? (
              <section className="br-public-property-detail__section">
                <h4>Описание объекта</h4>
                <p>{property.fullDescription}</p>
              </section>
            ) : null}

            <PropertyChipList title="Что входит" items={property.features} />
            <PropertyChipList title="Удобства" items={property.aggregatedAmenities} />
            <PropertyChipList title="Правила" items={property.houseRules} />
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
        />
      ) : (
        <div className="br-public-property-section__empty br-card br-card--subtle">
          {emptyRoomsText}
        </div>
      )}
    </article>
  );
}
