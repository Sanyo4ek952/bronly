import { notFound } from "next/navigation";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import {
  RoomAmenitiesSection,
  RoomBaseFields,
  RoomPhotosField,
  RoomPricingFields,
  RoomPublishSettings,
} from "@/features/property/edit-room/ui/room-form-blocks";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, getRussianPluralForm, readSearchParams } from "@/shared/lib";
import { Button, DashboardPageNav } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getActiveRoomWord(count: number) {
  return getRussianPluralForm(count, ["активный номер", "активных номера", "активных номеров"]);
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

  const resolvedSearchParams = await readSearchParams(searchParams);
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

          <RoomBaseFields title="Основное" description="Короткая карточка номера без лишнего шума." />

          <RoomPricingFields title="Вместимость и цена" description="То, что чаще всего правят с телефона." />

          <RoomAmenitiesSection
            title="Удобства номера"
            description="Главные удобства сразу, дополнительные по раскрытию."
            amenities={[]}
          />

          <RoomPhotosField title="Фото номера" description="Можно выбрать до 10 фото сразу. Первое фото станет главным." />

          <RoomPublishSettings title="Настройки" description="Оставьте только то, что важно для публикации." />

          <div className="br-active-step__actions br-room-form__actions">
            <Button type="submit">Сохранить номер</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
