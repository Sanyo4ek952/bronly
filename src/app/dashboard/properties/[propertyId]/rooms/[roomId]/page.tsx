import Image from "next/image";
import { notFound } from "next/navigation";

import { formatMoney } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, StatusPill } from "@/shared/ui";

type PropertyRoomPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
};

export default async function PropertyRoomPage({ params }: PropertyRoomPageProps) {
  const { propertyId, roomId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const room = property.rooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: room.title },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{property.title}</p>
            <h2>{room.title}</h2>
            <p>Страница номера с краткой сводкой, фото и переходом в настройки.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}>Настройки</ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card br-room-page-hero">
        <div className="br-room-page-hero__media">
          {room.photos[0] ? (
            <Image
              src={room.photos[0].url}
              alt={`${room.title} — главное фото`}
              width={1600}
              height={960}
              unoptimized
              className="br-room-page-hero__image"
            />
          ) : (
            <div className="br-room-page-hero__placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="br-room-page-hero__content">
          <div className="br-room-page-hero__header">
            <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Активен" : "Неактивен"}</StatusPill>
            <strong className="br-room-page__price">{formatMoney(room.pricePerNight)} / ночь</strong>
          </div>
          <div className="br-selected-room-meta">
            <span>{room.capacity} гостя</span>
            <span>{room.bedrooms} спальни</span>
            <span>{room.area} м²</span>
            <span>Фото: {room.photos.length}</span>
            <span>Сезонных цен: {room.seasonalPrices.length}</span>
            <span>Занятых диапазонов: {room.busyRanges.length}</span>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Что можно сделать</h2>
            <p>Основные действия по номеру вынесены на отдельные страницы.</p>
          </div>
        </div>

        <div className="br-quick-grid br-quick-grid--rooms">
          <article className="br-quick-card">
            <strong>Настройки номера</strong>
            <p>Обновите название, вместимость, базовую цену, сезонные цены и фото.</p>
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`} variant="secondary">
              Открыть настройки
            </ButtonLink>
          </article>
          <article className="br-quick-card">
            <strong>Календарь занятости</strong>
            <p>Занятые даты по этому номеру управляются в общем календаре объекта.</p>
            <ButtonLink href={`/dashboard/properties/${property.id}/calendar`} variant="secondary">
              Открыть календарь
            </ButtonLink>
          </article>
        </div>
      </section>

      {room.amenities.length ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Удобства</h2>
              <p>Список удобств, которые показываются в карточке номера.</p>
            </div>
          </div>
          <div className="br-room-amenities">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="br-room-amenity-chip">
                {amenity}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
