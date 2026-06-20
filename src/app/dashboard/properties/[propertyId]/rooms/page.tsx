import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav } from "@/shared/ui";
import { AdminPageHeader, ObjectSummaryCard, StatusBadge } from "@/widgets/property-admin";
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
  const publicHref = property.ownerPublicSlug ? `/p/${property.ownerPublicSlug}` : "/dashboard/settings";
  const busyRangeCount = property.rooms.reduce((total, room) => total + room.busyRanges.length, 0);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера" },
        ])}
        compact
      />

      <AdminPageHeader
        compact
        title="Номера объекта"
        description="Откройте нужный номер, следите за активностью и быстро переходите в календарь или настройки."
        actions={<ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>}
        notice={
          <>
            {notice ? <div className="br-inline-notice">{notice}</div> : null}
            {subscription && roomUsageLabel ? (
              <div className="br-inline-notice br-inline-notice--soft">
                Подписка: {roomUsageLabel}
                {roomLimitHint ? ` — ${roomLimitHint}` : ""}
              </div>
            ) : null}
          </>
        }
      />

      <ObjectSummaryCard
        property={property}
        busyRangeCount={busyRangeCount}
        roomsHref={`/dashboard/properties/${property.id}/rooms`}
        calendarHref={`/dashboard/properties/${property.id}/calendar`}
        publicHref={publicHref}
        compact
      />

      <section className="br-dashboard-block br-card">
        <PropertySectionNav propertyId={property.id} active="rooms" />
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Номера и цены</h2>
            <p>Карточки показывают статус, базовую цену, фото и объём ручной настройки по каждому номеру.</p>
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
                      <StatusBadge kind="room" isActive={room.isActive} />
                    </div>
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
                    Настройки
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
