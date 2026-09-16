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
import { Button, DashboardPageNav, InlineNotice, Panel } from "@/shared/ui";
import { AdminPageHeader, StatusBadge } from "@/widgets/property-admin";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
const formStackClass = "grid min-w-0 gap-4";

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
  const propertyDescription = [property.title, property.propertyType, [property.city, property.address].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

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

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Объект владельца
          </p>
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
        </div>
        <AdminPageHeader variant="plain" title="Новый номер" description={propertyDescription} />
      </div>

      {notice || (subscription && roomUsageLabel) ? (
        <div className="grid gap-3">
          {notice ? <InlineNotice tone="error">{notice}</InlineNotice> : null}
          {subscription && roomUsageLabel ? (
            <InlineNotice tone={subscription.isRoomLimitReached ? "warning" : "soft"}>
              Подписка: {roomUsageLabel}
              {roomLimitHint ? ` — ${roomLimitHint}` : ""}
            </InlineNotice>
          ) : null}
        </div>
      ) : null}

      <Panel padding="sm" surface="subtle" className="rounded-[var(--radius-lg)]">
        <PropertySectionNav propertyId={property.id} active="rooms" />
      </Panel>

      <Panel padding="md" className="grid min-w-0 gap-5 max-[720px]:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Добавить номер</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Заполните основные данные номера, а затем сохраните его в объект.
            </p>
          </div>
        </div>

        <form action={createOwnerRoom} className={formStackClass}>
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
      </Panel>
    </section>
  );
}
