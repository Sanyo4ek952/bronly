import { notFound } from "next/navigation";

import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { RoomCreationForm } from "@/features/property/setup/ui/room-creation-form";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, getRussianPluralForm, readSearchParams } from "@/shared/lib";
import { DashboardPageNav, InlineNotice } from "@/shared/ui";
import { AdminPageHeader, StatusBadge } from "@/widgets/property-admin";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";

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
    ? "Лимит активных номеров исчерпан. Архивируйте один из текущих номеров или увеличьте лимит подписки."
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

      <RoomCreationForm propertyId={property.id} disabled={subscription?.isRoomLimitReached} />
    </section>
  );
}
