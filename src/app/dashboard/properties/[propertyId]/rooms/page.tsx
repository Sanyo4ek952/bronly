import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice } from "@/shared/ui";
import { AdminPageHeader, ObjectSummaryCard, StatusBadge } from "@/widgets/property-admin";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomsPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const roomGridClass = "grid gap-4";
const roomCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(246_248_247_/_0.96))] p-4 md:grid-cols-[minmax(0,1fr)_auto]";
const roomCardMainClass =
  "grid gap-4 text-inherit no-underline md:grid-cols-[180px_minmax(0,1fr)] md:items-stretch focus-visible:rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]";
const roomMetaClass =
  "inline-flex min-h-8 items-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] px-3 text-[13px] text-[var(--color-muted)]";

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
    <section className={pageStackClass}>
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
            {notice ? <InlineNotice>{notice}</InlineNotice> : null}
            {subscription && roomUsageLabel ? (
              <InlineNotice tone="soft">
                Подписка: {roomUsageLabel}
                {roomLimitHint ? ` — ${roomLimitHint}` : ""}
              </InlineNotice>
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

      <section className={sectionCardClass}>
        <PropertySectionNav propertyId={property.id} active="rooms" />
      </section>

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Номера и цены</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Карточки показывают статус, базовую цену, фото и объем ручной настройки по каждому номеру.
            </p>
          </div>
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>
        </div>

        <div className={roomGridClass}>
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article key={room.id} className={roomCardClass}>
                <Link
                  href={`/dashboard/properties/${property.id}/rooms/${room.id}`}
                  className={roomCardMainClass}
                >
                  <div className="min-h-[136px] overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.12),rgb(17_29_27_/_0.10)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)] max-[640px]:min-h-[124px] max-[640px]:rounded-2xl">
                    {room.photos[0] ? (
                      <Image
                        src={room.photos[0].url}
                        alt={`${room.title} — главное фото`}
                        width={720}
                        height={480}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full min-h-[136px] w-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255_/_0.45)_0_18px,transparent_19px),linear-gradient(135deg,#dfeceb_0%,#b8dbe2_50%,#d7c3aa_100%)] max-[640px]:min-h-[124px]"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="grid content-center gap-2.5 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-1">
                        <strong className="text-lg font-semibold leading-[1.15] text-[var(--color-text)]">{room.title}</strong>
                        <p className="text-sm leading-[1.5] text-[var(--color-muted)]">
                          {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
                        </p>
                      </div>
                      <StatusBadge kind="room" isActive={room.isActive} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={roomMetaClass}>Фото: {room.photos.length}</span>
                      <span className={roomMetaClass}>Сезонных цен: {room.seasonalPrices.length}</span>
                      <span className={roomMetaClass}>Занятых диапазонов: {room.busyRanges.length}</span>
                    </div>
                  </div>
                </Link>

                <div className="grid content-center justify-items-end gap-3 max-[640px]:justify-items-stretch">
                  <strong className="whitespace-nowrap text-[22px] font-extrabold leading-none text-[var(--color-text)] max-[640px]:text-xl">
                    {room.pricePerNight.toLocaleString("ru-RU")} ₽
                  </strong>
                  <ButtonLink
                    href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}
                    variant="secondary"
                    className="max-[640px]:w-full"
                  >
                    Настройки
                  </ButtonLink>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-[1.5] text-[var(--color-muted)]">
              В объекте пока нет номеров. Нажмите «Добавить номер», чтобы создать первый.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
