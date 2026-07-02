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
import { cn } from "@/shared/lib/cn";
import { Button, Input, SubmitButton, Textarea } from "@/shared/ui";
import { DangerZone, PhotoManager, StatusBadge } from "@/widgets/property-admin";

type RoomSettingsEditorProps = {
  propertyId?: string | null;
  redirectTo: string;
  room: OwnerRoomDetail;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[rgb(15_23_42_/_0.08)] bg-[rgb(255_255_255_/_0.94)] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const propertyFormGridClass = "grid gap-4 md:grid-cols-2";
const compactPricingGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-4";
const inlineFieldsClass = "grid gap-4 md:grid-cols-2";
const toggleListClass = "grid gap-3";
const toggleRowClass = cn(
  "flex min-h-14 items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-[14px] text-sm text-[var(--color-text)]",
  "max-[640px]:min-h-[52px]",
);
const seasonalFormClass =
  "grid gap-4 rounded-[20px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.94)] p-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end";

export function RoomSettingsEditor({ propertyId, redirectTo, room }: RoomSettingsEditorProps) {
  const isStandalone = room.kind === "standalone_room";
  const location = room.location;

  return (
    <article className={pageStackClass}>
      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <strong className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{room.title}</strong>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
            </p>
          </div>
          <StatusBadge kind="room" isActive={room.isActive} />
        </div>

        <div className="grid gap-4 rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.96),rgb(243_248_247_/_0.86))] p-4">
          <div className="min-h-[180px] overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]">
            {room.photos[0] ? (
              <Image
                src={room.photos[0].url}
                alt={`${room.title} — главное фото`}
                width={1200}
                height={700}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255_/_0.45)_0_18px,transparent_19px),linear-gradient(135deg,#dfeceb_0%,#b8dbe2_50%,#d7c3aa_100%)]"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="grid gap-2.5">
            <strong className="text-base font-semibold leading-[1.2] text-[var(--color-text)]">
              {room.photos[0] ? "Главное фото номера" : "Фото номера пока нет"}
            </strong>
            <span className="text-sm leading-[1.55] text-[var(--color-muted)]">
              {room.photos[0]
                ? `Всего фото: ${room.photos.length}. Первое фото показывается в публичной карточке номера.`
                : "Добавьте первое фото, чтобы оно появилось в карточке номера и на публичных страницах."}
            </span>
          </div>
        </div>

        <form action={updateOwnerRoom} className={pageStackClass}>
          <input type="hidden" name="propertyId" value={propertyId ?? ""} />
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <RoomFormSection title="Основное" description="Самые частые правки по номеру в одном блоке.">
            <div className={propertyFormGridClass}>
              <Input id={`room-title-${room.id}`} name="title" label="Название номера" defaultValue={room.title} />
              {isStandalone ? (
                <>
                  <Input id={`room-city-${room.id}`} name="city" label="Город" defaultValue={location.city} />
                  <Input
                    id={`room-address-${room.id}`}
                    name="address"
                    label="Адрес"
                    defaultValue={location.address}
                    wrapperClassName="grid gap-1.5 md:col-span-2"
                  />
                </>
              ) : null}
            </div>
          </RoomFormSection>

          <RoomFormSection title="Вместимость и цена" description="Параметры для карточки номера и расчета цены.">
            <div className={compactPricingGridClass}>
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
              <div className={pageStackClass}>
                <Textarea id={`room-short-description-${room.id}`} name="shortDescription" label="Краткое описание" defaultValue={location.shortDescription} />
                <Textarea
                  id={`room-full-description-${room.id}`}
                  name="fullDescription"
                  label="Подробное описание"
                  defaultValue={location.fullDescription}
                  className="min-h-[170px]"
                />
                <div className={inlineFieldsClass}>
                  <Input id={`room-phone-${room.id}`} name="phone" label="Телефон" defaultValue={location.phone} />
                  <Input id={`room-telegram-${room.id}`} name="telegram" label="Telegram" defaultValue={location.telegram} />
                </div>
              </div>
            </RoomFormSection>
          ) : null}

          <RoomFormSection title="Настройки" description="Финальные переключатели для публикации и работы с агентами.">
            <div className={toggleListClass}>
              <label className={toggleRowClass}>
                <span className="max-w-[calc(100%-42px)]">Номер активен</span>
                <input type="checkbox" name="isActive" defaultChecked={room.isActive} />
              </label>
              {isStandalone ? (
                <>
                  <label className={toggleRowClass}>
                    <span className="max-w-[calc(100%-42px)]">Готов сотрудничать с агентами</span>
                    <input type="checkbox" name="allowAgentInquiries" defaultChecked={location.allowAgentInquiries} />
                  </label>
                  <label className={toggleRowClass}>
                    <span className="max-w-[calc(100%-42px)]">Показывать контакты владельца агенту</span>
                    <input
                      type="checkbox"
                      name="allowOwnerContactSharing"
                      defaultChecked={location.allowOwnerContactSharing}
                    />
                  </label>
                </>
              ) : null}
            </div>
          </RoomFormSection>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div />
            <Button type="submit" fullWidth>
              Сохранить номер
            </Button>
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

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Сезонные цены</h3>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Быстро обновляйте периоды и стоимость, не покидая страницу номера.
            </p>
          </div>
        </div>

        <div className={pageStackClass}>
          {room.seasonalPrices.length ? (
            room.seasonalPrices.map((seasonalPrice) => (
              <form key={seasonalPrice.id} action={updateRoomSeasonalPrice} className={seasonalFormClass}>
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
                <label className={toggleRowClass}>
                  <span className="max-w-[calc(100%-42px)]">Активна</span>
                  <input type="checkbox" name="isActive" defaultChecked={seasonalPrice.isActive} />
                </label>
                <div className="grid gap-2 xl:min-w-[180px]">
                  <Button type="submit">Сохранить</Button>
                  <Button type="submit" variant="danger" formAction={deleteRoomSeasonalPrice}>
                    Удалить
                  </Button>
                </div>
              </form>
            ))
          ) : (
            <p className="text-sm leading-[1.5] text-[var(--color-muted)]">Сезонные цены пока не добавлены.</p>
          )}

          <form action={createRoomSeasonalPrice} className={seasonalFormClass}>
            <input type="hidden" name="propertyId" value={propertyId ?? ""} />
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Input id={`season-start-new-${room.id}`} name="startsOn" type="date" label="С" />
            <Input id={`season-end-new-${room.id}`} name="endsOn" type="date" label="По" />
            <Input id={`season-price-new-${room.id}`} name="pricePerNight" type="number" step="0.01" min="0" label="Цена за ночь" />
            <label className={toggleRowClass}>
              <span className="max-w-[calc(100%-42px)]">Активна</span>
              <input type="checkbox" name="isActive" defaultChecked />
            </label>
            <SubmitButton pendingLabel="Сохранение" fullWidth>
              Добавить сезонную цену
            </SubmitButton>
          </form>
        </div>
      </section>

      <DangerZone
        title="Удаление номера"
        description="Удаление необратимо. Для подтверждения введите DELETE и только затем запускайте действие."
      >
        <form action={deleteOwnerRoom} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
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
