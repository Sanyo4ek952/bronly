import { notFound } from "next/navigation";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";
import { RoomFormSection } from "@/features/property/edit-room/ui/room-form-section";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav, Input } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getActiveRoomWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "активный номер";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "активных номера";
  }

  return "активных номеров";
}

export default async function PropertyRoomCreatePage({ params, searchParams }: PropertyRoomCreatePageProps) {
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
    ? "Лимит активных номеров уже исчерпан. Вы можете сохранить новый номер как неактивный, а затем деактивировать другой номер или продлить подписку."
    : subscription?.roomLimit != null && subscription.remainingRoomSlots != null
      ? `Сейчас доступно еще ${subscription.remainingRoomSlots} ${getActiveRoomWord(subscription.remainingRoomSlots)}.`
      : null;

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const notice = getRoomCreateNotice(error);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: "Новый номер" },
        ])}
        compact
      />

      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Добавьте новый номер для этого объекта.</p>
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
            <h2>Добавить номер</h2>
            <p>Заполните основные данные номера, а затем сохраните его в объект.</p>
          </div>
        </div>

        <form action={createOwnerRoom} className="br-owner-editor br-owner-editor--muted br-room-form">
          <input type="hidden" name="propertyId" value={property.id} />

          <RoomFormSection title="Основное" description="Короткая карточка номера без лишнего шума.">
            <div className="br-property-form__grid">
              <Input id="room-title-new" name="title" label="Название номера" />
            </div>
          </RoomFormSection>

          <RoomFormSection title="Вместимость и цена" description="То, что чаще всего правят с телефона.">
            <div className="br-property-form__grid br-room-form__grid--compact">
              <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Гостей" defaultValue="2" />
              <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="Спален" defaultValue="1" />
              <Input id="room-area-new" name="area" type="number" min="0" label="Площадь, м²" defaultValue="0" />
              <Input id="room-price-new" name="pricePerNight" type="number" min="0" step="0.01" label="Базовая цена за ночь" defaultValue="0" />
            </div>
          </RoomFormSection>

          <RoomFormSection title="Удобства номера" description="Главные удобства сразу, дополнительные по раскрытию.">
            <RoomAmenitiesField initialAmenities={[]} />
          </RoomFormSection>

          <RoomFormSection title="Фото номера" description="Можно выбрать до 10 фото сразу. Первое фото станет главным.">
            <Input
              id="room-photos-new"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              label="Фотографии номера"
              description="JPG, PNG, WebP или GIF, до 5 МБ каждое."
            />
          </RoomFormSection>

          <RoomFormSection title="Настройки" description="Оставьте только то, что важно для публикации.">
            <div className="br-toggle-list br-room-form__toggles">
              <label className="br-toggle">
                <span>Номер активен</span>
                <input type="checkbox" name="isActive" defaultChecked />
              </label>
            </div>
          </RoomFormSection>

          <div className="br-active-step__actions br-room-form__actions">
            <Button type="submit">Сохранить номер</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
