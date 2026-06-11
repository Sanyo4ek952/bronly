import Image from "next/image";
import { HousePlus, Settings } from "lucide-react";
import Link from "next/link";

import { getOwnerInventory } from "@/entities/property";
import { getOwnerRoomDetail } from "@/entities/room";
import { AddInventoryButton } from "@/widgets/add-inventory-button";
import { AppIcon, ButtonLink, StatusPill } from "@/shared/ui";

import { formatMoney, getPropertyNotice, getRoomsNotice } from "./page-helpers";

type PropertiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function getMessage(error: string, success: string) {
  if (success === "deleted") {
    return "Объект удалён.";
  }

  return getPropertyNotice(error, success) || getRoomsNotice(error, success);
}

function getRoomsLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "номер";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "номера";
  }

  return "номеров";
}

function buildStandaloneRoomHref(roomId: string) {
  return `/dashboard/properties?roomId=${encodeURIComponent(roomId)}`;
}

function formatDateRange(startsOn: string, endsOn: string) {
  const starts = new Date(startsOn).toLocaleDateString("ru-RU");
  const ends = new Date(endsOn).toLocaleDateString("ru-RU");
  return startsOn === endsOn ? starts : `${starts} - ${ends}`;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const roomId = getSearchString(params, "roomId");
  const error = getSearchString(params, "error");
  const success = getSearchString(params, "success");
  const [inventory, selectedRoom] = await Promise.all([getOwnerInventory(), roomId ? getOwnerRoomDetail(roomId) : Promise.resolve(null)]);

  const properties = inventory.filter((item) => item.kind !== "standalone_room");
  const standaloneRooms = inventory.filter((item) => item.kind === "standalone_room");
  const standaloneRoomDetail = selectedRoom?.kind === "standalone_room" ? selectedRoom : null;
  const message = getMessage(error, success);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Объекты и номера</h2>
            <p>Управляйте объектами и отдельными номерами в одном месте. Объекты показываются сверху, а отдельные номера доступны отдельным блоком ниже.</p>
          </div>
          <AddInventoryButton />
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}
      </section>

      {inventory.length ? (
        <>
          <section className="br-dashboard-block br-card">
            <div className="br-dashboard-block__header">
              <div>
                <h3>Объекты</h3>
                <p>Карточки объектов ведут к их номерам, календарю занятости и настройкам публикации.</p>
              </div>
            </div>

            {properties.length ? (
              <div className="br-owner-property-list">
                {properties.map((item) => (
                  <article key={item.id} className="br-owner-property-card">
                    <Link
                      href={`/dashboard/properties/${item.id}/rooms`}
                      className="br-owner-property-card__link"
                      aria-label={`Открыть номера объекта ${item.title}`}
                    />
                    <div className="br-owner-property-card__media">
                      {item.coverImageUrl ? (
                        <Image
                          src={item.coverImageUrl}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1180px) 25vw, (min-width: 700px) 40vw, 100vw"
                          unoptimized
                          className="br-owner-property-card__image"
                        />
                      ) : (
                        <div className="br-owner-property-card__image br-owner-property-card__image--placeholder" aria-hidden="true" />
                      )}
                    </div>

                    <div className="br-owner-property-card__header">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.propertyType}</p>
                      </div>

                      <div className="br-owner-property-card__topbar">
                        <StatusPill variant={item.published && !item.isFrozen ? "active" : "inactive"}>
                          {item.isFrozen ? "Заморожен" : item.published ? "Опубликован" : "Скрыт"}
                        </StatusPill>
                        <Link href={`/dashboard/properties/${item.id}`} className="br-owner-property-card__settings" aria-label={`Открыть настройки объекта ${item.title}`}>
                          <AppIcon icon={Settings} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>

                    <div className="br-owner-property-card__meta">
                      <p className="br-owner-property-card__address">{item.city}, {item.address}</p>

                      <div className="br-summary-card__rows">
                        <div className="br-summary-card__row">
                          <span>Номера</span>
                          <strong>
                            {item.roomCount} {getRoomsLabel(item.roomCount)}
                          </strong>
                        </div>
                        <div className="br-summary-card__row">
                          <span>Активные номера</span>
                          <strong>{item.activeRoomCount}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="br-owner-actions">
                      <ButtonLink href={`/dashboard/properties/${item.id}/rooms`} variant="secondary">
                        Открыть номера
                      </ButtonLink>
                      <Link href={item.ownerPublicSlug ? `/p/${item.ownerPublicSlug}` : "/dashboard/settings"} className="br-link-button">
                        {item.ownerPublicSlug ? "Открыть публичную ссылку" : "Заполнить slug владельца"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="br-owner-muted">Пока нет объектов. Ниже можно работать с отдельными номерами.</p>
            )}
          </section>

          <section className="br-dashboard-block br-card">
            <div className="br-dashboard-block__header">
              <div>
                <h3>Отдельные номера</h3>
                <p>Самостоятельные номера без объекта открываются прямо на этой странице. Настройки и календарь остаются в отдельных экранах.</p>
              </div>
            </div>

            {standaloneRooms.length ? (
              <>
                <div className="br-owner-property-list">
                  {standaloneRooms.map((item) => {
                    const isSelected = standaloneRoomDetail?.id === item.id;
                    const roomHref = `${buildStandaloneRoomHref(item.id)}#standalone-room-detail`;

                    return (
                      <article key={item.id} className={`br-owner-property-card${isSelected ? " br-owner-property-card--selected" : ""}`}>
                        <Link
                          href={roomHref}
                          className="br-owner-property-card__link"
                          aria-label={`Открыть карточку номера ${item.title}`}
                        />
                        <div className="br-owner-property-card__media">
                          {item.coverImageUrl ? (
                            <Image
                              src={item.coverImageUrl}
                              alt={item.title}
                              fill
                              sizes="(min-width: 1180px) 25vw, (min-width: 700px) 40vw, 100vw"
                              unoptimized
                              className="br-owner-property-card__image"
                            />
                          ) : (
                            <div className="br-owner-property-card__image br-owner-property-card__image--placeholder" aria-hidden="true" />
                          )}
                        </div>
                        <div className="br-owner-property-card__header">
                          <div>
                            <strong>{item.title}</strong>
                            <p>Отдельный номер</p>
                          </div>
                          <div className="br-owner-property-card__topbar">
                            <StatusPill variant={item.isActive ? "active" : "inactive"}>{item.isActive ? "Активен" : "Неактивен"}</StatusPill>
                            <Link href={`/dashboard/rooms/${item.id}/settings`} className="br-owner-property-card__settings" aria-label={`Открыть настройки номера ${item.title}`}>
                              <AppIcon icon={Settings} aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                        <div className="br-owner-property-card__meta">
                          <p className="br-owner-property-card__address">{item.city}, {item.address}</p>
                          <div className="br-summary-card__rows">
                            <div className="br-summary-card__row">
                              <span>Город</span>
                              <strong>{item.city || "не указан"}</strong>
                            </div>
                            <div className="br-summary-card__row">
                              <span>Цена</span>
                              <strong>{Math.round(item.pricePerNight).toLocaleString("ru-RU")} ₽</strong>
                            </div>
                          </div>
                        </div>
                        <div className="br-owner-actions">
                          <ButtonLink href={roomHref} variant={isSelected ? "primary" : "secondary"}>
                            {isSelected ? "Номер открыт" : "Открыть номер"}
                          </ButtonLink>
                          <ButtonLink href={`/dashboard/rooms/${item.id}/calendar`} variant="secondary">Календарь</ButtonLink>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {standaloneRoomDetail ? (
                  <div id="standalone-room-detail" className="br-owner-stack">
                    <section className="br-dashboard-block br-card">
                      <div className="br-dashboard-block__header">
                        <div>
                          <h2>{standaloneRoomDetail.title}</h2>
                          <p>{standaloneRoomDetail.location.city}, {standaloneRoomDetail.location.address}</p>
                        </div>
                        <div className="br-room-page__actions">
                          <ButtonLink href="/dashboard/properties" variant="secondary">Скрыть карточку</ButtonLink>
                          <ButtonLink href={`/dashboard/rooms/${standaloneRoomDetail.id}/settings`}>Настройки</ButtonLink>
                        </div>
                      </div>
                    </section>

                    <section className="br-dashboard-block br-card br-room-page-hero">
                      <div className="br-room-page-hero__media">
                        {standaloneRoomDetail.photos[0] ? (
                          <Image
                            src={standaloneRoomDetail.photos[0].url}
                            alt={`${standaloneRoomDetail.title} — главное фото`}
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
                          <StatusPill variant={standaloneRoomDetail.isActive ? "active" : "inactive"}>
                            {standaloneRoomDetail.isActive ? "Активен" : "Неактивен"}
                          </StatusPill>
                          <strong className="br-room-page__price">{formatMoney(standaloneRoomDetail.pricePerNight)} / ночь</strong>
                        </div>
                        <div className="br-selected-room-meta">
                          <span>{standaloneRoomDetail.capacity} гостя</span>
                          <span>{standaloneRoomDetail.bedrooms} спальни</span>
                          <span>{standaloneRoomDetail.area} м²</span>
                          <span>Фото: {standaloneRoomDetail.photos.length}</span>
                          <span>Сезонных цен: {standaloneRoomDetail.seasonalPrices.length}</span>
                          <span>Занятых диапазонов: {standaloneRoomDetail.busyRanges.length}</span>
                        </div>
                        <div className="br-owner-actions">
                          <ButtonLink href={`/dashboard/rooms/${standaloneRoomDetail.id}/settings`} variant="secondary">Редактировать номер</ButtonLink>
                          <ButtonLink href={`/dashboard/rooms/${standaloneRoomDetail.id}/calendar`} variant="secondary">Календарь занятости</ButtonLink>
                        </div>
                      </div>
                    </section>

                    {standaloneRoomDetail.location.shortDescription || standaloneRoomDetail.location.fullDescription ? (
                      <section className="br-dashboard-block br-card">
                        <div className="br-dashboard-block__header">
                          <div>
                            <h3>Описание</h3>
                            <p>Краткая справка по самостоятельному номеру, которая помогает быстро проверить контент перед публикацией.</p>
                          </div>
                        </div>
                        <div className="br-owner-stack">
                          {standaloneRoomDetail.location.shortDescription ? <p>{standaloneRoomDetail.location.shortDescription}</p> : null}
                          {standaloneRoomDetail.location.fullDescription ? <p>{standaloneRoomDetail.location.fullDescription}</p> : null}
                        </div>
                      </section>
                    ) : null}

                    <section className="br-dashboard-block br-card">
                      <div className="br-dashboard-block__header">
                        <div>
                          <h3>Быстрая сводка</h3>
                          <p>Здесь собраны ключевые данные номера без перехода на отдельную страницу просмотра.</p>
                        </div>
                      </div>

                      <div className="br-quick-grid br-quick-grid--rooms">
                        <article className="br-quick-card">
                          <strong>Контакты и заезд</strong>
                          <p>Телефон: {standaloneRoomDetail.location.phone || "не указан"}</p>
                          <p>WhatsApp: {standaloneRoomDetail.location.whatsapp || "не указан"}</p>
                          <p>Telegram: {standaloneRoomDetail.location.telegram || "не указан"}</p>
                          <p>Заезд: {standaloneRoomDetail.location.checkInTime || "не указано"}</p>
                          <p>Выезд: {standaloneRoomDetail.location.checkOutTime || "не указано"}</p>
                        </article>
                        <article className="br-quick-card">
                          <strong>Публикация и агентский контур</strong>
                          <p>Показывать агентам: {standaloneRoomDetail.location.allowAgentInquiries ? "да" : "нет"}</p>
                          <p>Передавать контакты владельца: {standaloneRoomDetail.location.allowOwnerContactSharing ? "да" : "нет"}</p>
                        </article>
                      </div>
                    </section>

                    {standaloneRoomDetail.photos.length > 1 ? (
                      <section className="br-dashboard-block br-card">
                        <div className="br-dashboard-block__header">
                          <div>
                            <h3>Фото номера</h3>
                            <p>Первое фото используется как обложка. Остальные помогают быстро проверить галерею.</p>
                          </div>
                        </div>

                        <div className="br-photo-grid br-photo-grid--compact">
                          {standaloneRoomDetail.photos.map((photo, index) => (
                            <article key={photo.id} className="br-photo-card">
                              <div className="br-photo-card__media">
                                <Image
                                  src={photo.url}
                                  alt={`${standaloneRoomDetail.title} — фото ${index + 1}`}
                                  width={1200}
                                  height={900}
                                  unoptimized
                                  className="br-photo-card__image"
                                />
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {standaloneRoomDetail.amenities.length ? (
                      <section className="br-dashboard-block br-card">
                        <div className="br-dashboard-block__header">
                          <div>
                            <h3>Удобства</h3>
                            <p>Этот список показывается в карточке номера и помогает проверить полноту описания.</p>
                          </div>
                        </div>
                        <div className="br-room-amenities">
                          {standaloneRoomDetail.amenities.map((amenity) => (
                            <span key={amenity} className="br-room-amenity-chip">{amenity}</span>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="br-dashboard-block br-card">
                      <div className="br-dashboard-block__header">
                        <div>
                          <h3>Цены и занятые даты</h3>
                          <p>Сезонные цены и календарь занятости остаются самостоятельными сущностями, но видны здесь для быстрого контроля.</p>
                        </div>
                      </div>

                      <div className="br-quick-grid br-quick-grid--rooms">
                        <article className="br-quick-card">
                          <strong>Сезонные цены</strong>
                          {standaloneRoomDetail.seasonalPrices.length ? (
                            <ul className="br-legend-list">
                              {standaloneRoomDetail.seasonalPrices.map((item) => (
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
                          {standaloneRoomDetail.busyRanges.length ? (
                            <ul className="br-legend-list">
                              {standaloneRoomDetail.busyRanges.map((item) => (
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
                  </div>
                ) : null}
              </>
            ) : (
              <p className="br-owner-muted">Пока нет отдельных номеров. Создайте самостоятельный номер, чтобы управлять им без объекта.</p>
            )}
          </section>
        </>
      ) : (
        <article className="br-empty-card br-card">
          <div className="br-empty-card__art" aria-hidden="true">
            <AppIcon icon={HousePlus} />
          </div>
          <strong>Пока нет объектов и номеров</strong>
          <p>Добавьте объект с номерами или создайте отдельный номер, чтобы перейти к ценам, фото и календарю занятости.</p>
          <div className="br-owner-stack" style={{ width: "100%" }}>
            <ButtonLink href="/dashboard/properties/new" fullWidth>
              Создать объект
            </ButtonLink>
            <ButtonLink href="/dashboard/rooms/new" variant="secondary" fullWidth>
              Создать отдельный номер
            </ButtonLink>
          </div>
        </article>
      )}
    </section>
  );
}
