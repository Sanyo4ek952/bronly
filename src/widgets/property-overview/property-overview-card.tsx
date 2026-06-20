import type { OwnerPropertyDetail } from "@/entities/property";
import { ButtonLink, StatusPill } from "@/shared/ui";

import { PropertyGallery, type PropertyGalleryItem } from "./property-gallery";

type PropertyOverviewCardProps = {
  property: OwnerPropertyDetail;
  galleryItems: PropertyGalleryItem[];
};

export function PropertyOverviewCard({ property, galleryItems }: PropertyOverviewCardProps) {
  const hasAddress = Boolean(property.address.trim());
  const hasDescription = Boolean(property.shortDescription.trim() || property.fullDescription.trim());
  const hasFeatures = property.features.length > 0;

  return (
    <section className="br-dashboard-block br-card br-room-page-hero">
      <div className="br-room-page-hero__media">
        {galleryItems.length ? (
          <PropertyGallery items={galleryItems} />
        ) : (
          <div className="br-property-gallery-empty" role="status">
            <strong>Фотографий пока нет</strong>
            <p>Добавьте фото объекта или фото номеров, чтобы они появились в галерее.</p>
          </div>
        )}
      </div>

      <div className="br-room-page-hero__content">
        <div className="br-room-page-hero__header">
          <div className="br-owner-stack br-owner-stack--compact">
            <div className="br-owner-room-card__meta">
              <span>{property.propertyType}</span>
              <span>{property.city}</span>
              <span>Номеров: {property.rooms.length}</span>
            </div>
            <div>
              <h2>{property.title}</h2>
              {hasAddress ? <p>{property.address}</p> : null}
            </div>
          </div>
          <div className="br-owner-actions">
            <StatusPill variant={property.published && !property.isFrozen ? "active" : "inactive"}>
              {property.isFrozen ? "Заморожен" : property.published ? "Опубликован" : "Скрыт"}
            </StatusPill>
          </div>
        </div>

        {hasDescription ? (
          <div className="br-owner-stack br-owner-stack--compact">
            {property.shortDescription.trim() ? <p>{property.shortDescription}</p> : null}
            {property.fullDescription.trim() ? <p>{property.fullDescription}</p> : null}
          </div>
        ) : null}

        {hasFeatures ? (
          <section className="br-owner-stack br-owner-stack--compact">
            <div>
              <h3>Удобства</h3>
            </div>
            <div className="br-room-amenities">
              {property.features.map((feature) => (
                <span key={feature} className="br-room-amenity-chip">
                  {feature}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="br-owner-actions">
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>
        </div>
      </div>
    </section>
  );
}
