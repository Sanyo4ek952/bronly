import type { OwnerRoomDetail } from "@/entities/room";
import { ButtonLink, DashboardPageNav, StatusPill } from "@/shared/ui";

import { formatMoney } from "@/app/dashboard/properties/page-helpers";
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
    <section className="br-owner-stack">
      <DashboardPageNav backHref={backHref} breadcrumbs={breadcrumbs} compact />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            {propertyLabel ? <p className="br-owner-muted">{propertyLabel}</p> : null}
            <h2>{title}</h2>
            <p>{intro}</p>
          </div>
          <div className="br-room-page__actions">
            {listHref && listLabel ? (
              <ButtonLink href={listHref} variant="secondary">
                {listLabel}
              </ButtonLink>
            ) : null}
            <ButtonLink href={settingsHref}>Настройки</ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card br-room-page-hero">
        <div className="br-room-page-hero__media">
          <RoomPhotoCarousel photos={room.photos} roomTitle={room.title} />
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
          <div className="br-owner-actions">
            <ButtonLink href={settingsHref} variant="secondary">
              Редактировать номер
            </ButtonLink>
            <ButtonLink href={calendarHref} variant="secondary">
              {calendarCtaLabel}
            </ButtonLink>
          </div>
        </div>
      </section>

      {room.location.shortDescription || room.location.fullDescription ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h3>Описание</h3>
              <p>Краткая и полная информация по номеру для проверки контента перед публикацией.</p>
            </div>
          </div>
          <div className="br-owner-stack">
            {room.location.shortDescription ? <p>{room.location.shortDescription}</p> : null}
            {room.location.fullDescription ? <p>{room.location.fullDescription}</p> : null}
          </div>
        </section>
      ) : null}

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h3>Быстрая сводка</h3>
            <p>Контакты, публикация и условия заезда собраны на одном экране номера.</p>
          </div>
        </div>

        <div className="br-quick-grid br-quick-grid--rooms">
          <article className="br-quick-card">
            <strong>Контакты и заезд</strong>
            <p>Телефон: {room.location.phone || "не указан"}</p>
            <p>WhatsApp: {room.location.whatsapp || "не указан"}</p>
            <p>Telegram: {room.location.telegram || "не указан"}</p>
            <p>Заезд: {room.location.checkInTime || "не указано"}</p>
            <p>Выезд: {room.location.checkOutTime || "не указано"}</p>
          </article>
          <article className="br-quick-card">
            <strong>Публикация и агентский контур</strong>
            <p>Показывать агентам: {room.location.allowAgentInquiries ? "да" : "нет"}</p>
            <p>Передавать контакты владельца: {room.location.allowOwnerContactSharing ? "да" : "нет"}</p>
          </article>
        </div>
      </section>

      {room.amenities.length ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h3>Удобства</h3>
              <p>Этот список показывается в карточке номера и помогает проверить полноту описания.</p>
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

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h3>Цены и занятые даты</h3>
            <p>{calendarSummaryText}</p>
          </div>
        </div>

        <div className="br-quick-grid br-quick-grid--rooms">
          <article className="br-quick-card">
            <strong>Сезонные цены</strong>
            {room.seasonalPrices.length ? (
              <ul className="br-legend-list">
                {room.seasonalPrices.map((item) => (
                  <li key={item.id}>
                    <span>{formatDateRange(item.startsOn, item.endsOn)}</span>
                    <strong>{formatMoney(item.pricePerNight)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Сезонных цен пока нет.</p>
            )}
          </article>
          <article className="br-quick-card">
            <strong>Занятые даты</strong>
            {room.busyRanges.length ? (
              <ul className="br-legend-list">
                {room.busyRanges.map((item) => (
                  <li key={item.id}>
                    <span>{formatDateRange(item.startsOn, item.endsOn)}</span>
                    <strong>{item.label || "Занято"}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Занятых дат пока нет.</p>
            )}
          </article>
        </div>
      </section>
    </section>
  );
}
