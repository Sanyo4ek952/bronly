import Image from "next/image";
import { X } from "lucide-react";

import type { OwnerRoomDetail } from "@/entities/room/model/types";
import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";
import { RoomFormSection } from "@/features/property/edit-room/ui/room-form-section";
import {
  createRoomSeasonalPrice,
  deleteOwnerRoom,
  deleteRoomPhoto,
  deleteRoomSeasonalPrice,
  setRoomPhotoPrimary,
  setOwnerRoomArchived,
  updateOwnerRoom,
  uploadRoomPhoto,
} from "@/features/property/owner-mutations";
import { AppIcon, Button, IconButton, Input, SubmitButton, Textarea } from "@/shared/ui";
import { AgentCollaborationToggle, DangerZone, PhotoManager } from "@/widgets/property-admin";

type RoomSettingsEditorProps = {
  propertyId?: string | null;
  redirectTo: string;
  room: OwnerRoomDetail;
  propertyAllowAgentInquiries?: boolean;
};

const pageStackClass = "grid gap-6 max-[640px]:gap-5";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const propertyFormGridClass = "grid gap-4 md:grid-cols-2";
const compactPricingGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-4";
const inlineFieldsClass = "grid gap-4 md:grid-cols-2";
const seasonalCreateFormClass =
  "grid gap-4 border-t border-[var(--border)] pt-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto] xl:items-end";
const sectionNavLinkClass =
  "inline-flex min-h-9 flex-none items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

function formatSeasonalDate(value: string) {
  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}.${month}.${year}` : value;
}

export function RoomSettingsEditor({ propertyId, redirectTo, room, propertyAllowAgentInquiries }: RoomSettingsEditorProps) {
  const isStandalone = room.kind === "standalone_room";
  const location = room.location;
  const allowAgentInquiries = isStandalone ? location.allowAgentInquiries : Boolean(propertyAllowAgentInquiries);

  return (
    <article className={pageStackClass}>
      <section className="grid gap-4 border-b border-[var(--border)] pb-6 max-[640px]:pb-5" aria-label="Карточка номера">
        <div className="grid items-center gap-4 md:grid-cols-[minmax(220px,0.75fr)_minmax(0,1fr)]">
          <div className="aspect-[16/9] min-h-[150px] overflow-hidden rounded-[var(--radius-lg)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]">
            {room.photos[0] ? (
              <Image
                src={room.photos[0].url}
                alt={`${room.title} — главное фото`}
                width={1200}
                height={700}
                unoptimized
                loading="eager"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255_/_0.45)_0_18px,transparent_19px),linear-gradient(135deg,#dfeceb_0%,#b8dbe2_50%,#d7c3aa_100%)]"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="grid gap-2">
            <strong className="text-lg font-semibold leading-[1.2] text-[var(--text)]">
              {room.photos[0] ? "Главное фото номера" : "Фото номера пока нет"}
            </strong>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              {room.photos[0]
                ? `Всего фото: ${room.photos.length}. Первое фото показывается в публичной карточке номера.`
                : "Добавьте первое фото, чтобы оно появилось в карточке номера и на публичных страницах."}
            </p>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
            </p>
          </div>
        </div>
      </section>

      <nav
        className="sticky top-3 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[rgb(255_252_247_/_0.96)] p-2 shadow-[0_8px_24px_rgb(17_29_27_/_0.08)] [scrollbar-width:none] backdrop-blur [&::-webkit-scrollbar]:hidden"
        aria-label="Разделы настроек номера"
      >
        <a className={sectionNavLinkClass} href="#room-details">
          Основное
        </a>
        <a className={sectionNavLinkClass} href="#room-amenities">
          Удобства
        </a>
        {isStandalone ? (
          <a className={sectionNavLinkClass} href="#room-description">
            Описание
          </a>
        ) : null}
        <a className={sectionNavLinkClass} href="#room-agents">
          Агенты
        </a>
        <a className={sectionNavLinkClass} href="#photos">
          Фото
        </a>
        <a className={sectionNavLinkClass} href="#seasonal-prices">
          Цены
        </a>
      </nav>

      <form action={updateOwnerRoom} className="grid">
        <input type="hidden" name="propertyId" value={propertyId ?? ""} />
        <input type="hidden" name="roomId" value={room.id} />
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <RoomFormSection
          id="room-details"
          title="Основное"
          description="Название и адрес, по которым номер узнают в кабинете и на публичных страницах."
          summary={isStandalone && location.city ? `${room.title} · ${location.city}` : room.title}
          defaultOpen
        >
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

        <RoomFormSection
          id="room-capacity"
          title="Вместимость и цена"
          description="Параметры карточки номера и базовая стоимость одной ночи."
          summary={`${room.capacity} гостей · ${room.bedrooms} спальни · ${room.area} м² · ${priceFormatter.format(room.pricePerNight)} ₽`}
        >
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

        <RoomFormSection
          id="room-amenities"
          title="Удобства номера"
          description="Отметьте удобства, которые увидит гость в карточке номера."
          summary={room.amenities.length ? `Сохранено: ${room.amenities.length}` : "Не выбраны"}
        >
          <RoomAmenitiesField initialAmenities={room.amenities} />
        </RoomFormSection>

        {isStandalone ? (
          <RoomFormSection
            id="room-description"
            title="Описание и контакты"
            description="Информация самостоятельного номера для публичной страницы и связи с владельцем."
            summary={location.phone || location.telegram ? "Описание и контакты заполнены" : "Нужно заполнить контакты"}
          >
            <div className="grid gap-4">
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

        <RoomFormSection
          id="room-agents"
          title="Работа с агентами"
          description={
            isStandalone
              ? "Разрешите агентам присылать предложения о сотрудничестве по этому номеру."
              : "Настройка применяется ко всему объекту и всем его номерам."
          }
          summary={allowAgentInquiries ? "Предложения открыты" : "Предложения закрыты"}
        >
          <div className="flex min-h-16 items-center justify-between gap-4 border-y border-[var(--border)] py-4 max-[720px]:grid">
            <p className="max-w-[68ch] text-xs leading-[1.5] text-[var(--text-muted)]">
              {isStandalone
                ? "После вашего подтверждения агент сможет показывать номер в своей витрине."
                : "Изменение откроет или закроет предложения агентов сразу для всего объекта."}
            </p>
            <AgentCollaborationToggle
              targetId={isStandalone ? room.id : propertyId ?? room.id}
              targetKind={isStandalone ? "standalone_room" : "property"}
              checked={allowAgentInquiries}
              itemTitle={isStandalone ? room.title : room.propertyTitle}
              label="Хочу работать с агентами"
            />
          </div>
        </RoomFormSection>

        <div className="flex justify-end pt-5">
          <Button type="submit" fullWidth className="sm:w-auto">
            Сохранить основные настройки
          </Button>
        </div>
      </form>

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

      <section id="seasonal-prices" className="grid scroll-mt-28 gap-4 border-y border-[var(--border)] py-6 max-[640px]:py-5">
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.15] text-[var(--text)]">Сезонные цены</h2>
            <p className="max-w-[68ch] text-sm leading-[1.55] text-[var(--text-muted)]">
              Цена действует на все даты периода, включая начало и конец. Созданный период можно удалить и добавить заново.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {room.seasonalPrices.length ? (
            <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
              {room.seasonalPrices.map((seasonalPrice) => (
                <div
                  key={seasonalPrice.id}
                  className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(120px,0.65fr)_auto] sm:px-4"
                >
                  <span className="min-w-0 text-[13px] font-semibold leading-[1.35] text-[var(--text)]">
                    {formatSeasonalDate(seasonalPrice.startsOn)} — {formatSeasonalDate(seasonalPrice.endsOn)}
                  </span>
                  <span className="row-start-2 text-xs leading-[1.35] text-[var(--text-muted)] sm:row-start-auto sm:text-right sm:text-[13px] sm:font-semibold sm:text-[var(--text)]">
                    {priceFormatter.format(seasonalPrice.pricePerNight)} ₽ / ночь
                  </span>
                  <form action={deleteRoomSeasonalPrice} className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1">
                    <input type="hidden" name="propertyId" value={propertyId ?? ""} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <input type="hidden" name="seasonalPriceId" value={seasonalPrice.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <IconButton
                      type="submit"
                      aria-label={`Удалить сезонную цену с ${formatSeasonalDate(seasonalPrice.startsOn)} по ${formatSeasonalDate(seasonalPrice.endsOn)}`}
                      title="Удалить период"
                      className="size-9 border-transparent bg-transparent text-[var(--danger)] shadow-none hover:border-[rgb(196_81_81_/_0.24)] hover:bg-[rgb(196_81_81_/_0.08)]"
                    >
                      <AppIcon icon={X} className="size-4" aria-hidden="true" />
                    </IconButton>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-[1.5] text-[var(--text-muted)]">Сезонные цены пока не добавлены.</p>
          )}

          <div className="grid gap-2 pt-1">
            <h3 className="text-base font-semibold text-[var(--text)]">Добавить период</h3>
            <p className="text-[13px] leading-[1.5] text-[var(--text-muted)]">Новая сезонная цена сразу участвует в расчёте.</p>
          </div>
          <form action={createRoomSeasonalPrice} className={seasonalCreateFormClass}>
            <input type="hidden" name="propertyId" value={propertyId ?? ""} />
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Input id={`season-start-new-${room.id}`} name="startsOn" type="date" label="Начало периода" />
            <Input id={`season-end-new-${room.id}`} name="endsOn" type="date" label="Конец периода" />
            <Input id={`season-price-new-${room.id}`} name="pricePerNight" type="number" step="0.01" min="0" label="Цена за ночь" />
            <SubmitButton pendingLabel="Сохранение" fullWidth>
              Добавить сезонную цену
            </SubmitButton>
          </form>
        </div>
      </section>

      <section className="grid gap-4 border-y border-[var(--border)] py-5" aria-labelledby="room-status-title">
        <div className={sectionHeaderClass}>
          <div className="grid max-w-[68ch] gap-1.5">
            <h2 id="room-status-title" className="text-xl font-semibold leading-[1.1] text-[var(--text)]">Статус номера</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              {room.isActive
                ? "Номер опубликован и доступен на публичных страницах. Чтобы временно скрыть его и остановить новые заявки, перенесите номер в архив."
                : "Номер находится в архиве: он скрыт с публичных страниц и не принимает новые заявки. Данные, фото и цены сохранены."}
            </p>
          </div>
          <form action={setOwnerRoomArchived}>
            <input type="hidden" name="propertyId" value={propertyId ?? ""} />
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="archived" value={room.isActive ? "true" : "false"} />
            <SubmitButton
              variant={room.isActive ? "secondary" : "primary"}
              pendingLabel={room.isActive ? "Переносим в архив" : "Восстанавливаем"}
            >
              {room.isActive ? "Архивировать номер" : "Вернуть из архива"}
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
