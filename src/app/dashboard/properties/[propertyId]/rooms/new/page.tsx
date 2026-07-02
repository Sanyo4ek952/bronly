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
import { Button, DashboardPageNav, InlineNotice } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const formCardClass =
  "grid gap-4 rounded-[24px] border border-[rgb(15_23_42_/_0.08)] bg-[rgb(255_255_255_/_0.94)] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";

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
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: "Новый номер" },
        ])}
        compact
      />

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{property.title}</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Добавьте новый номер для этого объекта.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="rooms" />

        {notice ? <InlineNotice>{notice}</InlineNotice> : null}
        {subscription && roomUsageLabel ? (
          <InlineNotice tone="soft">
            Подписка: {roomUsageLabel}
            {roomLimitHint ? ` — ${roomLimitHint}` : ""}
          </InlineNotice>
        ) : null}
      </section>

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Добавить номер</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Заполните основные данные номера, а затем сохраните его в объект.
            </p>
          </div>
        </div>

        <form action={createOwnerRoom} className={formCardClass}>
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

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div />
            <Button type="submit" fullWidth>
              Сохранить номер
            </Button>
          </div>
        </form>
      </section>
    </section>
  );
}
