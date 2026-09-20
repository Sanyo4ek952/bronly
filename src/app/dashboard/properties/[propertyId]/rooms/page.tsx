import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, getRussianPluralForm } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice, Panel } from "@/shared/ui";
import { AdminPageHeader, ObjectStats, StatusBadge } from "@/widgets/property-admin";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomsPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const roomGridClass = "grid min-w-0 gap-3";
const roomCardMainClass =
  "grid min-w-0 gap-4 text-inherit no-underline sm:grid-cols-[176px_minmax(0,1fr)] sm:items-stretch focus-visible:rounded-[18px] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.14)]";

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
    ? "Лимит активных номеров исчерпан. Редактирование и архивация доступны, но создание нового номера или восстановление номера из архива будут заблокированы."
    : subscription?.roomLimit != null && subscription.remainingRoomSlots != null
      ? `Свободно еще ${subscription.remainingRoomSlots} ${getSlotWord(subscription.remainingRoomSlots)} в лимите активных номеров.`
      : null;

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);
  const busyRangeCount = property.rooms.reduce((total, room) => total + room.busyRanges.length, 0);
  const activeRoomCount = property.rooms.filter((room) => room.isActive).length;
  const propertyDescription = [property.title, property.propertyType, [property.city, property.address].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

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

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Объект владельца
          </p>
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
        </div>
        <AdminPageHeader
          variant="plain"
          title="Номера объекта"
          description={propertyDescription}
          actions={
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`} className="max-[520px]:w-full">
              Добавить номер
            </ButtonLink>
          }
        />
      </div>

      {notice || (subscription && roomUsageLabel) ? (
        <div className="grid gap-3">
          {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}
          {subscription && roomUsageLabel ? (
            <InlineNotice tone={subscription.isRoomLimitReached ? "warning" : "soft"}>
              Подписка: {roomUsageLabel}
              {roomLimitHint ? ` — ${roomLimitHint}` : ""}
            </InlineNotice>
          ) : null}
        </div>
      ) : null}

      <Panel padding="sm" surface="subtle" className="rounded-[var(--radius-lg)]">
        <PropertySectionNav propertyId={property.id} active="rooms" />
      </Panel>

      <Panel padding="md" aria-label="Сводка по номерам">
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Все номера", value: String(property.rooms.length) },
            { label: "Активные", value: String(activeRoomCount) },
            { label: "Занятые даты", value: String(busyRangeCount), tone: "accent" },
          ]}
        />
      </Panel>

      <Panel padding="md" className="grid min-w-0 gap-5 max-[720px]:p-4">
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Номера и цены</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Откройте номер для подробностей или сразу перейдите к его настройкам.
            </p>
          </div>
        </div>

        <div className={roomGridClass}>
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article
                key={room.id}
                className="grid min-w-0 gap-3 rounded-[20px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.72)] p-3 shadow-[var(--shadow-sm)] xl:grid-cols-[minmax(0,1fr)_170px]"
              >
                <Link
                  href={`/dashboard/properties/${property.id}/rooms/${room.id}`}
                  className={roomCardMainClass}
                  aria-label={`Открыть номер «${room.title}»`}
                >
                  <div className="min-h-[148px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgb(255_255_255_/_0.12),rgb(17_29_27_/_0.10)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)] max-[640px]:aspect-[16/9] max-[640px]:min-h-0">
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
                        className="h-full min-h-[148px] w-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255_/_0.45)_0_18px,transparent_19px),linear-gradient(135deg,#dfeceb_0%,#b8dbe2_50%,#d7c3aa_100%)] max-[640px]:min-h-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="grid min-w-0 content-center gap-3 py-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-1">
                        <h3 className="break-words text-lg font-semibold leading-[1.15] text-[var(--color-text)]">
                          {room.title}
                        </h3>
                        <p className="text-sm leading-[1.5] text-[var(--color-muted)]">
                          {room.capacity} {getRussianPluralForm(room.capacity, ["гость", "гостя", "гостей"])} · {room.bedrooms}{" "}
                          {getRussianPluralForm(room.bedrooms, ["спальня", "спальни", "спален"])} · {room.area} м²
                        </p>
                      </div>
                      <StatusBadge kind="room" isActive={room.isActive} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-[1.4] text-[var(--text-muted)]">
                      <span>
                        <strong className="text-[var(--text)]">{room.photos.length}</strong>{" "}
                        {getRussianPluralForm(room.photos.length, ["фото", "фото", "фото"])}
                      </span>
                      <span>
                        <strong className="text-[var(--text)]">{room.seasonalPrices.length}</strong>{" "}
                        {getRussianPluralForm(room.seasonalPrices.length, ["сезонная цена", "сезонные цены", "сезонных цен"])}
                      </span>
                      <span>
                        <strong className="text-[var(--text)]">{room.busyRanges.length}</strong>{" "}
                        {getRussianPluralForm(room.busyRanges.length, ["занятый диапазон", "занятых диапазона", "занятых диапазонов"])}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="grid content-center gap-2 border-l border-[var(--border)] pl-4 max-xl:grid-cols-[minmax(0,1fr)_auto_auto] max-xl:items-center max-xl:border-l-0 max-xl:border-t max-xl:pl-0 max-xl:pt-3 max-[640px]:grid-cols-1">
                  <div className="grid gap-1 max-xl:mr-auto">
                    <strong className="whitespace-nowrap text-xl font-extrabold leading-none text-[var(--color-text)]">
                      {room.pricePerNight.toLocaleString("ru-RU")} ₽
                    </strong>
                    <span className="text-[11px] text-[var(--text-muted)]">за сутки</span>
                  </div>
                  <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}`} fullWidth>
                    Открыть номер
                  </ButtonLink>
                  <ButtonLink
                    href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}
                    variant="secondary"
                    fullWidth
                  >
                    Настройки
                  </ButtonLink>
                </div>
              </article>
            ))
          ) : (
            <div className="grid justify-items-center gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-8 text-center max-[520px]:justify-items-stretch">
              <div className="grid max-w-[520px] gap-2">
                <h3 className="text-xl font-semibold leading-[1.15] text-[var(--text)]">Добавьте первый номер</h3>
                <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
                  После создания здесь появятся цена, фото, активность и быстрые переходы к настройкам номера.
                </p>
              </div>
              <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`} className="max-[520px]:w-full">
                Добавить номер
              </ButtonLink>
            </div>
          )}
        </div>
      </Panel>
    </section>
  );
}
