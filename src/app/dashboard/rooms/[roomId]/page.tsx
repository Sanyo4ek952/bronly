import Image from "next/image";
import { notFound } from "next/navigation";

import { formatMoney } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room";
import { ButtonLink, StatusPill } from "@/shared/ui";

type StandaloneRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function StandaloneRoomPage({ params }: StandaloneRoomPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{room.location.propertyType}</p>
            <h2>{room.title}</h2>
            <p>{room.location.city}, {room.location.address}</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href="/dashboard/properties" variant="secondary">К общему списку</ButtonLink>
            <ButtonLink href={`/dashboard/rooms/${room.id}/settings`}>Настройки</ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card br-room-page-hero">
        <div className="br-room-page-hero__media">
          {room.photos[0] ? (
            <Image src={room.photos[0].url} alt={`${room.title} — главное фото`} width={1600} height={960} unoptimized className="br-room-page-hero__image" />
          ) : (
            <div className="br-room-page-hero__placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="br-room-page-hero__content">
          <div className="br-room-page-hero__header">
            <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Активен" : "Неактивен"}</StatusPill>
            <strong className="br-room-page__price">{formatMoney(room.pricePerNight)} / ночь</strong>
          </div>
          {room.subtitle ? <p>{room.subtitle}</p> : null}
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

      {room.amenities.length ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Удобства</h2>
              <p>Эти удобства показываются в карточке отдельного номера.</p>
            </div>
          </div>
          <div className="br-room-amenities">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="br-room-amenity-chip">{amenity}</span>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
