import Image from "next/image";
import { notFound } from "next/navigation";

import {
  createRoomSeasonalPrice,
  deleteOwnerRoom,
  deleteRoomPhoto,
  deleteRoomSeasonalPrice,
  setRoomPhotoPrimary,
  updateOwnerRoom,
  updateRoomSeasonalPrice,
  uploadRoomPhoto,
} from "@/app/dashboard/properties/actions";
import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, ButtonLink, Input, StatusPill, Textarea } from "@/shared/ui";
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
            <p>Список существующих номеров объекта и управление их ценами и фото.</p>
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
            <p>Откройте нужный номер, обновите его данные, сезонные цены и фото.</p>
          </div>
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>
        </div>

        <div className="br-owner-stack">
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article key={room.id} className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>{room.title}</strong>
                    <p>
                      {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
                    </p>
                  </div>
                  <StatusPill variant={room.isActive ? "active" : "inactive"}>
                    {room.isActive ? "Активен" : "Неактивен"}
                  </StatusPill>
                </div>

                <div className="br-room-photo-preview">
                  {room.photos[0] ? (
                    <Image
                      src={room.photos[0].url}
                      alt={`${room.title} — главное фото`}
                      width={1200}
                      height={700}
                      unoptimized
                      className="br-room-photo-preview__image"
                    />
                  ) : (
                    <div className="br-room-photo-preview__placeholder" aria-hidden="true" />
                  )}
                  <div className="br-room-photo-preview__copy">
                    <strong>{room.photos[0] ? "Главное фото номера" : "Фото номера пока нет"}</strong>
                    <span>
                      {room.photos[0]
                        ? `Всего фото: ${room.photos.length}. Первое фото показывается в публичных карточках.`
                        : "Добавьте первое фото, чтобы оно появилось в карточке номера и на публичных страницах."}
                    </span>
                  </div>
                </div>

                <form action={updateOwnerRoom} className="br-owner-stack">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="roomId" value={room.id} />
                  <div className="br-property-form__grid">
                    <Input id={`room-title-${room.id}`} name="title" label="Название" defaultValue={room.title} />
                    <Input
                      id={`room-subtitle-${room.id}`}
                      name="subtitle"
                      label="Подзаголовок"
                      defaultValue={room.subtitle}
                    />
                    <Input
                      id={`room-capacity-${room.id}`}
                      name="capacity"
                      type="number"
                      min="1"
                      label="Гостей"
                      defaultValue={String(room.capacity)}
                    />
                    <Input
                      id={`room-bedrooms-${room.id}`}
                      name="bedrooms"
                      type="number"
                      min="1"
                      label="Спален"
                      defaultValue={String(room.bedrooms)}
                    />
                    <Input
                      id={`room-area-${room.id}`}
                      name="area"
                      type="number"
                      min="0"
                      label="Площадь, м²"
                      defaultValue={String(room.area)}
                    />
                    <Input
                      id={`room-price-${room.id}`}
                      name="pricePerNight"
                      type="number"
                      min="0"
                      step="0.01"
                      label="Базовая цена за ночь"
                      defaultValue={String(room.pricePerNight)}
                    />
                  </div>

                  <Textarea
                    id={`room-amenities-${room.id}`}
                    name="amenities"
                    label="Удобства"
                    defaultValue={room.amenities.join("\n")}
                  />

                  <label className="br-toggle">
                    <span>Номер активен</span>
                    <input type="checkbox" name="isActive" defaultChecked={room.isActive} />
                  </label>

                  <div className="br-active-step__actions">
                    <Button type="submit">Сохранить номер</Button>
                  </div>
                </form>

                <section className="br-owner-photo-section">
                  <div className="br-section-heading">
                    <h3>Фото номера</h3>
                    <p>Первое фото показывается гостю в карточках номера и в заявке.</p>
                  </div>

                  <form action={uploadRoomPhoto} className="br-owner-photo-upload" encType="multipart/form-data">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <Input
                      id={`room-photo-upload-${room.id}`}
                      name="photo"
                      type="file"
                      accept="image/*"
                      label="Добавить фото номера"
                      wrapperClassName="br-owner-photo-upload__field"
                    />
                    <Button type="submit">Загрузить фото</Button>
                  </form>

                  {room.photos.length ? (
                    <div className="br-photo-grid br-photo-grid--compact">
                      {room.photos.map((photo, index) => (
                        <article key={photo.id} className="br-photo-card br-photo-card--compact">
                          <div className="br-photo-card__media">
                            <Image
                              src={photo.url}
                              alt={`${room.title} — фото ${index + 1}`}
                              width={900}
                              height={700}
                              unoptimized
                              className="br-photo-card__image"
                            />
                          </div>
                          <div className="br-photo-card__body">
                            <div className="br-photo-card__meta">
                              <strong>{index === 0 ? "Главное фото" : `Фото ${index + 1}`}</strong>
                              <span>{index === 0 ? "Показывается первым" : "Можно сделать главным"}</span>
                            </div>
                            <div className="br-photo-card__actions">
                              <form action={setRoomPhotoPrimary}>
                                <input type="hidden" name="propertyId" value={property.id} />
                                <input type="hidden" name="roomId" value={room.id} />
                                <input type="hidden" name="photoId" value={photo.id} />
                                <Button type="submit" variant="secondary" disabled={index === 0}>
                                  {index === 0 ? "Главное" : "Сделать первым"}
                                </Button>
                              </form>
                              <form action={deleteRoomPhoto}>
                                <input type="hidden" name="propertyId" value={property.id} />
                                <input type="hidden" name="roomId" value={room.id} />
                                <input type="hidden" name="photoId" value={photo.id} />
                                <Button type="submit" variant="danger">
                                  Удалить
                                </Button>
                              </form>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="br-owner-muted">У этого номера пока нет фото.</p>
                  )}
                </section>

                <div className="br-owner-stack">
                  <strong>Сезонные цены</strong>
                  {room.seasonalPrices.length ? (
                    room.seasonalPrices.map((seasonalPrice) => (
                      <form key={seasonalPrice.id} action={updateRoomSeasonalPrice} className="br-owner-inline-form">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="seasonalPriceId" value={seasonalPrice.id} />
                        <Input id={`season-start-${seasonalPrice.id}`} name="startsOn" type="date" label="С" defaultValue={seasonalPrice.startsOn} />
                        <Input id={`season-end-${seasonalPrice.id}`} name="endsOn" type="date" label="По" defaultValue={seasonalPrice.endsOn} />
                        <Input
                          id={`season-price-${seasonalPrice.id}`}
                          name="pricePerNight"
                          type="number"
                          step="0.01"
                          min="0"
                          label="Цена за ночь"
                          defaultValue={String(seasonalPrice.pricePerNight)}
                        />
                        <label className="br-toggle">
                          <span>Активна</span>
                          <input type="checkbox" name="isActive" defaultChecked={seasonalPrice.isActive} />
                        </label>
                        <div className="br-owner-actions">
                          <Button type="submit">Сохранить</Button>
                          <Button type="submit" variant="danger" formAction={deleteRoomSeasonalPrice}>
                            Удалить
                          </Button>
                        </div>
                      </form>
                    ))
                  ) : (
                    <p className="br-owner-muted">Сезонные цены пока не добавлены.</p>
                  )}

                  <form action={createRoomSeasonalPrice} className="br-owner-inline-form">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <Input id={`season-start-new-${room.id}`} name="startsOn" type="date" label="С" />
                    <Input id={`season-end-new-${room.id}`} name="endsOn" type="date" label="По" />
                    <Input
                      id={`season-price-new-${room.id}`}
                      name="pricePerNight"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Цена за ночь"
                    />
                    <label className="br-toggle">
                      <span>Активна</span>
                      <input type="checkbox" name="isActive" defaultChecked />
                    </label>
                    <Button type="submit">Добавить сезонную цену</Button>
                  </form>
                </div>

                <form action={deleteOwnerRoom} className="br-owner-danger">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="roomId" value={room.id} />
                  <Input
                    id={`room-delete-${room.id}`}
                    name="confirmation"
                    label="Введите DELETE для удаления номера"
                    placeholder="DELETE"
                  />
                  <Button type="submit" variant="danger">
                    Удалить номер
                  </Button>
                </form>
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
