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
import type { OwnerRoomDetail } from "@/entities/room/model/types";
import { Button, Input, Textarea } from "@/shared/ui";

type RoomSettingsEditorProps = {
  propertyId?: string | null;
  redirectTo: string;
  room: OwnerRoomDetail;
};

export function RoomSettingsEditor({ propertyId, redirectTo, room }: RoomSettingsEditorProps) {
  const isStandalone = room.kind === "standalone_room";
  const location = room.location;

  return (
    <article className="br-owner-editor">
      <div className="br-owner-editor__header">
        <div>
          <strong>{room.title}</strong>
          <p>
            {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
          </p>
        </div>
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
        <input type="hidden" name="propertyId" value={propertyId ?? ""} />
        <input type="hidden" name="roomId" value={room.id} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="br-property-form__grid">
          <Input id={`room-title-${room.id}`} name="title" label="Название" defaultValue={room.title} />
          <Input id={`room-subtitle-${room.id}`} name="subtitle" label="Подзаголовок" defaultValue={room.subtitle} />
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
          {isStandalone ? (
            <>
              <Input id={`room-type-${room.id}`} name="propertyType" label="Тип размещения" defaultValue={location.propertyType} />
              <Input id={`room-city-${room.id}`} name="city" label="Город" defaultValue={location.city} />
              <Input id={`room-timezone-${room.id}`} name="timezone" label="Часовой пояс" defaultValue={location.timezone} />
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

        <Textarea id={`room-amenities-${room.id}`} name="amenities" label="Удобства" defaultValue={room.amenities.join("\n")} />

        {isStandalone ? (
          <>
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
              <Input id={`room-whatsapp-${room.id}`} name="whatsapp" label="WhatsApp" defaultValue={location.whatsapp} />
              <Input id={`room-telegram-${room.id}`} name="telegram" label="Telegram" defaultValue={location.telegram} />
            </div>
            <div className="br-inline-fields">
              <Input id={`room-check-in-${room.id}`} name="checkInTime" label="Заезд" defaultValue={location.checkInTime} />
              <Input id={`room-check-out-${room.id}`} name="checkOutTime" label="Выезд" defaultValue={location.checkOutTime} />
            </div>
            <div className="br-toggle-list">
              <label className="br-toggle">
                <span>Готов сотрудничать с агентами</span>
                <input type="checkbox" name="allowAgentInquiries" defaultChecked={location.allowAgentInquiries} />
              </label>
              <label className="br-toggle">
                <span>Показывать контакты владельца агенту</span>
                <input type="checkbox" name="allowOwnerContactSharing" defaultChecked={location.allowOwnerContactSharing} />
              </label>
            </div>
          </>
        ) : null}

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
          <input type="hidden" name="propertyId" value={propertyId ?? ""} />
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
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
                      <input type="hidden" name="propertyId" value={propertyId ?? ""} />
                      <input type="hidden" name="roomId" value={room.id} />
                      <input type="hidden" name="photoId" value={photo.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <Button type="submit" variant="secondary" disabled={index === 0}>
                        {index === 0 ? "Главное" : "Сделать первым"}
                      </Button>
                    </form>
                    <form action={deleteRoomPhoto}>
                      <input type="hidden" name="propertyId" value={propertyId ?? ""} />
                      <input type="hidden" name="roomId" value={room.id} />
                      <input type="hidden" name="photoId" value={photo.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
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
          <Button type="submit">Добавить сезонную цену</Button>
        </form>
      </div>

      <form action={deleteOwnerRoom} className="br-owner-danger">
        <input type="hidden" name="propertyId" value={propertyId ?? ""} />
        <input type="hidden" name="roomId" value={room.id} />
        <Input id={`room-delete-${room.id}`} name="confirmation" label="Введите DELETE для удаления номера" placeholder="DELETE" />
        <Button type="submit" variant="danger">
          Удалить номер
        </Button>
      </form>
    </article>
  );
}
