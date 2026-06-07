import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ButtonLink, StatusPill } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomsPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSlotWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "место";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "места";
  }

  return "мест";
}

export default async function PropertyRoomsPage({ params, searchParams }: PropertyRoomsPageProps) {
  const { propertyId } = await params;
  const [property, profile] = await Promise.all([getOwnerPropertyDetail(propertyId), getCurrentAuthProfile()]);

  if (!property) {
    notFound();
  }

  const subscription = profile ? await getSubscriptionRuntimeState(profile.id, "owner") : null;
  const roomUsageLabel = subscription
    ? subscription.roomLimit == null
      ? `${subscription.activeRoomCount} активных номеров`
      : `${subscription.activeRoomCount} из ${subscription.roomLimit} активных номеров`
    : null;
  const roomLimitHint = subscription?.isRoomLimitReached
    ? "Лимит активных номеров исчерпан. Деактивация и редактирование текущих данных доступны, но создание нового активного номера или активация неактивного номера будут заблокированы."
    : subscription?.roomLimit != null && subscription.remainingRoomSlots != null
      ? `Свободно еще ${subscription.remainingRoomSlots} ${getSlotWord(subscription.remainingRoomSlots)} в лимите активных номеров.`
      : null;

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);

  return (
    <section className="br-owner-stack">
      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Список существующих номеров объекта и переход к каждому номеру отдельно.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="rooms" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
        {subscription && roomUsageLabel ? (
          <div className="br-owner-muted">
            Подписка: {roomUsageLabel}
            {roomLimitHint ? ` — ${roomLimitHint}` : ""}
          </div>
        ) : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Номера и цены</h2>
            <p>Откройте нужный номер, а для редактирования используйте кнопку настроек на карточке.</p>
          </div>
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>
        </div>

        <div className="br-owner-room-grid">
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article key={room.id} className="br-owner-room-card">
                <Link href={`/dashboard/properties/${property.id}/rooms/${room.id}`} className="br-owner-room-card__main">
                  <div className="br-owner-room-card__thumb">
                    {room.photos[0] ? (
                      <Image
                        src={room.photos[0].url}
                        alt={`${room.title} — главное фото`}
                        width={720}
                        height={480}
                        unoptimized
                        className="br-owner-room-card__image"
                      />
                    ) : (
                      <div className="br-owner-room-card__placeholder" aria-hidden="true" />
                    )}
                  </div>

                  <div className="br-owner-room-card__content">
                    <div className="br-owner-room-card__header">
                      <div>
                        <strong>{room.title}</strong>
                        <p>
                          {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
                        </p>
                      </div>
                      <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Активен" : "Неактивен"}</StatusPill>
                    </div>

                    {room.subtitle ? <p className="br-owner-room-card__subtitle">{room.subtitle}</p> : null}

                    <div className="br-owner-room-card__meta">
                      <span>Фото: {room.photos.length}</span>
                      <span>Сезонных цен: {room.seasonalPrices.length}</span>
                      <span>Занятых диапазонов: {room.busyRanges.length}</span>
                    </div>
                  </div>
                </Link>

                <div className="br-owner-room-card__aside">
                  <strong className="br-owner-room-card__price">{room.pricePerNight.toLocaleString("ru-RU")} ₽</strong>
                  <ButtonLink
                    href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}
                    variant="secondary"
                    className="br-owner-room-card__settings"
                  >
                    <span aria-hidden="true">⚙</span>
                    <span className="br-owner-room-card__settings-label">Настройки</span>
                  </ButtonLink>
                </div>
              </article>
            ))
          ) : (
            <p className="br-owner-muted">В объекте пока нет номеров. Нажмите «Добавить номер», чтобы создать первый.</p>
          )}
        </div>
      </section>
    </section>
  );
}
