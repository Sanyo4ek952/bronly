import type { OwnerRoomDetail } from "@/entities/room";
import { formatRubles } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, Panel, StatusPill } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";
import { RoomPhotoCarousel } from "./room-photo-carousel";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type RoomDetailPageProps = {
  room: OwnerRoomDetail;
  title: string;
  intro: string;
  backHref: string;
  breadcrumbs: BreadcrumbItem[];
  settingsHref: string;
  calendarHref: string;
  propertyLabel?: string | null;
  calendarCtaLabel?: string;
  calendarSummaryText: string;
  listHref?: string;
  listLabel?: string;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
const chipClass =
  "inline-flex min-h-8 items-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] px-3 text-[13px] text-[var(--color-muted)]";
const statCardClass =
  "grid gap-2 rounded-[20px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.92)] p-4";
const amenityChipClass =
  "inline-flex min-h-8 items-center rounded-full border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] px-3 text-[13px] text-[var(--color-text)]";

function formatDateRange(startsOn: string, endsOn: string) {
  const starts = new Date(startsOn).toLocaleDateString("ru-RU");
  const ends = new Date(endsOn).toLocaleDateString("ru-RU");
  return startsOn === endsOn ? starts : `${starts} - ${ends}`;
}

export function RoomDetailPage({
  room,
  title,
  intro,
  backHref,
  breadcrumbs,
  settingsHref,
  calendarHref,
  propertyLabel,
  calendarCtaLabel = "Открыть календарь",
  calendarSummaryText,
  listHref,
  listLabel,
}: RoomDetailPageProps) {
  return (
    <section className={pageStackClass}>
      <DashboardPageNav backHref={backHref} breadcrumbs={breadcrumbs} compact />

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            {room.kind === "standalone_room" ? "Отдельный номер" : "Номер объекта"}
          </p>
          <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Опубликован" : "В архиве"}</StatusPill>
        </div>
        <AdminPageHeader
          variant="plain"
          title={title}
          description={[propertyLabel, intro].filter(Boolean).join(" · ")}
          actions={
            <>
              {listHref && listLabel ? (
                <ButtonLink href={listHref} variant="secondary">
                  {listLabel}
                </ButtonLink>
              ) : null}
              <ButtonLink href={settingsHref}>Настройки</ButtonLink>
            </>
          }
        />
      </div>

      <Panel padding="md" className="grid min-w-0 gap-5 max-[720px]:p-4">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-stretch">
          <div className="min-w-0">
            <RoomPhotoCarousel photos={room.photos} roomTitle={room.title} />
          </div>

          <div className="grid content-start gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StatusPill variant={room.isActive ? "active" : "inactive"}>
                {room.isActive ? "Опубликован" : "В архиве"}
              </StatusPill>
              <strong className="whitespace-nowrap text-[24px] font-extrabold leading-none text-[var(--color-text)]">
                {formatRubles(room.pricePerNight)} / ночь
              </strong>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={chipClass}>{room.capacity} гостя</span>
              <span className={chipClass}>{room.bedrooms} спальни</span>
              <span className={chipClass}>{room.area} м²</span>
              <span className={chipClass}>Фото: {room.photos.length}</span>
              <span className={chipClass}>Сезонных цен: {room.seasonalPrices.length}</span>
              <span className={chipClass}>Занятых диапазонов: {room.busyRanges.length}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink href={settingsHref} variant="secondary" fullWidth>
                Редактировать номер
              </ButtonLink>
              <ButtonLink href={calendarHref} variant="secondary" fullWidth>
                {calendarCtaLabel}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Panel>

      {room.location.description ? (
        <Panel padding="md" className="grid gap-4 max-[720px]:p-4">
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Описание</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Информация по номеру для проверки перед публикацией.
            </p>
          </div>
          <div className="grid gap-3 text-sm leading-[1.65] text-[var(--color-text)]">
            <p className="whitespace-pre-line">{room.location.description}</p>
          </div>
        </Panel>
      ) : null}

      <Panel padding="md" className="grid gap-4 max-[720px]:p-4">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Быстрая сводка</h2>
          <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
            Контакты, публикация и условия заезда собраны на одном экране номера.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className={statCardClass}>
            <strong className="text-base font-semibold text-[var(--color-text)]">Контакты и заезд</strong>
            <div className="grid gap-2 text-sm leading-[1.55] text-[var(--color-muted)]">
              <p>Телефон: {room.location.phone || "не указан"}</p>
              <p>Telegram: {room.location.telegram || "не указан"}</p>
              <p>Заезд: {room.location.checkInTime || "не указано"}</p>
              <p>Выезд: {room.location.checkOutTime || "не указано"}</p>
            </div>
          </article>
          <article className={statCardClass}>
            <strong className="text-base font-semibold text-[var(--color-text)]">Публикация и агентский контур</strong>
            <div className="grid gap-2 text-sm leading-[1.55] text-[var(--color-muted)]">
              <p>Показывать агентам: {room.location.allowAgentInquiries ? "да" : "нет"}</p>
              <p>Передавать контакты владельца: {room.location.allowOwnerContactSharing ? "да" : "нет"}</p>
            </div>
          </article>
        </div>
      </Panel>

      {room.amenities.length ? (
        <Panel padding="md" className="grid gap-4 max-[720px]:p-4">
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Удобства</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Этот список показывается в карточке номера и помогает проверить полноту описания.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {room.amenities.map((amenity) => (
              <span key={amenity} className={amenityChipClass}>
                {amenity}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel padding="md" className="grid gap-4 max-[720px]:p-4">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Цены и занятые даты</h2>
          <p className="text-sm leading-[1.55] text-[var(--color-muted)]">{calendarSummaryText}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className={statCardClass}>
            <strong className="text-base font-semibold text-[var(--color-text)]">Сезонные цены</strong>
            {room.seasonalPrices.length ? (
              <ul className="grid gap-2.5">
                {room.seasonalPrices.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] px-3 py-2.5"
                  >
                    <span className="text-sm leading-[1.5] text-[var(--color-muted)]">{formatDateRange(item.startsOn, item.endsOn)}</span>
                    <strong className="text-sm font-semibold text-[var(--color-text)]">{formatRubles(item.pricePerNight)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Сезонных цен пока нет.</p>
            )}
          </article>
          <article className={statCardClass}>
            <strong className="text-base font-semibold text-[var(--color-text)]">Занятые даты</strong>
            {room.busyRanges.length ? (
              <ul className="grid gap-2.5">
                {room.busyRanges.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] px-3 py-2.5"
                  >
                    <span className="text-sm leading-[1.5] text-[var(--color-muted)]">{formatDateRange(item.startsOn, item.endsOn)}</span>
                    <strong className="text-sm font-semibold text-[var(--color-text)]">{item.label || "Занято"}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Занятых дат пока нет.</p>
            )}
          </article>
        </div>
      </Panel>
    </section>
  );
}
