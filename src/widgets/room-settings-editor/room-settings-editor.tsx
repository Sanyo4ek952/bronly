import Image from "next/image";

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
import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";
import { RoomFormSection } from "@/features/property/edit-room/ui/room-form-section";
import type { OwnerRoomDetail } from "@/entities/room/model/types";
import { Button, Input, SubmitButton, Textarea } from "@/shared/ui";
import { DangerZone, PhotoManager, StatusBadge } from "@/widgets/property-admin";

type RoomSettingsEditorProps = {
  propertyId?: string | null;
  redirectTo: string;
  room: OwnerRoomDetail;
};

export function RoomSettingsEditor({ propertyId, redirectTo, room }: RoomSettingsEditorProps) {
  const isStandalone = room.kind === "standalone_room";
  const location = room.location;

  return (
    <article className="br-owner-stack">
      <section className="br-owner-editor br-card">
        <div className="br-owner-editor__header">
          <div>
            <strong>{room.title}</strong>
            <p>
              {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
            </p>
          </div>
          <StatusBadge kind="room" isActive={room.isActive} />
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
                ? `Всего фото: ${room.photos.length}. Первое фото показывается в публичной карточке номера.`
                : "Добавьте первое фото, чтобы оно появилось в карточке номера и на публичных страницах."}
            </span>
          </div>
        </div>

        <form action={updateOwnerRoom} className="br-owner-stack br-room-form">
          <input type="hidden" name="propertyId" value={propertyId ?? ""} />
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <RoomFormSection title="Основное" description="Самые частые правки по номеру в одном блоке.">
            <div className="br-property-form__grid">
              <Input id={`room-title-${room.id}`} name="title" label="Название номера" defaultValue={room.title} />
              {isStandalone ? (
                <>
                  <Input id={`room-city-${room.id}`} name="city" label="Город" defaultValue={location.city} />
                  <Input
                    id={`room-address-${room.id}`}
                    name="address"
                    label="Адрес"
                    defaultValue={location.address}
                    wrapperClassName="br-form-field--span-2"
                  />
                </>
              ) : null}
            </div>
          </RoomFormSection>

          <RoomFormSection title="Вместимость и цена" description="Параметры для карточки номера и расчёта цены.">
            <div className="br-property-form__grid br-room-form__grid--compact">
              <Input id={`room-capacity-${room.id}`} name="capacity" type="number" min="1" label="Гостей" defaultValue={String(room.capacity)} />
              <Input id={`room-bedrooms-${room.id}`} name="bedrooms" type="number" min="1" label="Спален" defaultValue={String(room.bedrooms)} />
              <Input id={`room-area-${room.id}`} name="area" type="number" min="0" label="Площадь, м²" defaultValue={String(room.area)} />
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
          </RoomFormSection>

          <RoomFormSection title="Удобства номера" description="Основные удобства, которые увидит гость в карточке.">
            <RoomAmenitiesField id={`room-amenities-${room.id}`} initialAmenities={room.amenities} />
          </RoomFormSection>

          {isStandalone ? (
            <RoomFormSection title="Описание и контакты" description="Тексты, контакты и время заезда в одном месте.">
              <div className="br-owner-stack">
                <Textarea id={`room-short-description-${room.id}`} name="shortDescription" label="Краткое описание" defaultValue={location.shortDescription} />
                <Textarea
                  id={`room-full-description-${room.id}`}
                  name="fullDescription"
                  label="Подробное описание"
                  defaultValue={location.fullDescription}
                  className="br-textarea--lg"
                />
                <div className="br-inline-fields">
                  <Input id={`room-phone-${room.id}`} name="phone" label="Телефон" defaultValue={location.phone} />
                  <Input id={`room-telegram-${room.id}`} name="telegram" label="Telegram" defaultValue={location.telegram} />
                </div>
              </div>
            </RoomFormSection>
          ) : null}

          <RoomFormSection title="Настройки" description="Финальные переключатели для публикации и работы с агентами.">
            <div className="br-toggle-list br-room-form__toggles">
              <label className="br-toggle">
                <span>Номер активен</span>
                <input type="checkbox" name="isActive" defaultChecked={room.isActive} />
              </label>
              {isStandalone ? (
                <>
                  <label className="br-toggle">
                    <span>Готов сотрудничать с агентами</span>
                    <input type="checkbox" name="allowAgentInquiries" defaultChecked={location.allowAgentInquiries} />
                  </label>
                  <label className="br-toggle">
                    <span>Показывать контакты владельца агенту</span>
                    <input type="checkbox" name="allowOwnerContactSharing" defaultChecked={location.allowOwnerContactSharing} />
                  </label>
                </>
              ) : null}
            </div>
          </RoomFormSection>

          <div className="br-active-step__actions br-room-form__actions">
            <Button type="submit">Сохранить номер</Button>
          </div>
        </form>
      </section>

      <PhotoManager
        title="Фото номера"
        description="Первое фото показывается гостю в карточке номера и в заявке."
        emptyText="У этого номера пока нет фото."
        photos={room.photos}
        uploadAction={uploadRoomPhoto}
        primaryAction={setRoomPhotoPrimary}
        deleteAction={deleteRoomPhoto}
        hiddenFields={[
          { name: "propertyId", value: propertyId ?? "" },
          { name: "roomId", value: room.id },
          { name: "redirectTo", value: redirectTo },
        ]}
        uploadInputId={`room-photo-upload-${room.id}`}
        uploadLabel="Добавить фото номера"
        uploadDescription="Можно выбрать до 10 фото за раз. JPG, PNG, WebP или GIF, до 5 МБ каждое."
        entityTitle={room.title}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h3>Сезонные цены</h3>
            <p>Быстро обновляйте периоды и стоимость, не покидая страницу номера.</p>
          </div>
        </div>

        <div className="br-owner-stack">
          {room.seasonalPrices.length ? (
            room.seasonalPrices.map((seasonalPrice) => (
              <form key={seasonalPrice.id} action={updateRoomSeasonalPrice} className="br-owner-inline-form">
                <input type="hidden" name="propertyId" value={propertyId ?? ""} />
                <input type="hidden" name="roomId" value={room.id} />
                <input type="hidden" name="seasonalPriceId" value={seasonalPrice.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
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
            <input type="hidden" name="propertyId" value={propertyId ?? ""} />
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Input id={`season-start-new-${room.id}`} name="startsOn" type="date" label="С" />
            <Input id={`season-end-new-${room.id}`} name="endsOn" type="date" label="По" />
            <Input id={`season-price-new-${room.id}`} name="pricePerNight" type="number" step="0.01" min="0" label="Цена за ночь" />
            <label className="br-toggle">
              <span>Активна</span>
              <input type="checkbox" name="isActive" defaultChecked />
            </label>
            <SubmitButton pendingLabel="Сохранение">Добавить сезонную цену</SubmitButton>
          </form>
        </div>
      </section>

      <DangerZone
        title="Удаление номера"
        description="Удаление необратимо. Для подтверждения введите DELETE и только затем запускайте действие."
      >
        <form action={deleteOwnerRoom} className="br-owner-danger">
          <input type="hidden" name="propertyId" value={propertyId ?? ""} />
          <input type="hidden" name="roomId" value={room.id} />
          <Input id={`room-delete-${room.id}`} name="confirmation" label="Введите DELETE для удаления номера" placeholder="DELETE" />
          <Button type="submit" variant="danger">
            Удалить номер
          </Button>
        </form>
      </DangerZone>
    </article>
  );
}
