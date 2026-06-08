import { notFound } from "next/navigation";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
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
    return "Р°РєС‚РёРІРЅС‹Р№ РЅРѕРјРµСЂ";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂР°";
  }

  return "Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂРѕРІ";
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
      ? `${subscription.activeRoomCount} Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂРѕРІ`
      : `${subscription.activeRoomCount} РёР· ${subscription.roomLimit} Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂРѕРІ`
    : null;
  const roomLimitHint = subscription?.isRoomLimitReached
    ? "Р›РёРјРёС‚ Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂРѕРІ СѓР¶Рµ РёСЃС‡РµСЂРїР°РЅ. Р’С‹ РјРѕР¶РµС‚Рµ СЃРѕС…СЂР°РЅРёС‚СЊ РЅРѕРІС‹Р№ РЅРѕРјРµСЂ РєР°Рє РЅРµР°РєС‚РёРІРЅС‹Р№, Р° Р·Р°С‚РµРј РґРµР°РєС‚РёРІРёСЂРѕРІР°С‚СЊ РґСЂСѓРіРѕР№ РЅРѕРјРµСЂ РёР»Рё РїСЂРѕРґР»РёС‚СЊ РїРѕРґРїРёСЃРєСѓ."
    : subscription?.roomLimit != null && subscription.remainingRoomSlots != null
      ? `РЎРµР№С‡Р°СЃ РґРѕСЃС‚СѓРїРЅРѕ РµС‰Рµ ${subscription.remainingRoomSlots} ${getActiveRoomWord(subscription.remainingRoomSlots)}.`
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
            <p>Р”РѕР±Р°РІСЊС‚Рµ РЅРѕРІС‹Р№ РЅРѕРјРµСЂ РґР»СЏ СЌС‚РѕРіРѕ РѕР±СЉРµРєС‚Р°.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="rooms" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
        {subscription && roomUsageLabel ? (
          <div className="br-owner-muted">
            РџРѕРґРїРёСЃРєР°: {roomUsageLabel}
            {roomLimitHint ? ` вЂ” ${roomLimitHint}` : ""}
          </div>
        ) : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Р”РѕР±Р°РІРёС‚СЊ РЅРѕРјРµСЂ</h2>
            <p>Р—Р°РїРѕР»РЅРёС‚Рµ РѕСЃРЅРѕРІРЅС‹Рµ РґР°РЅРЅС‹Рµ РЅРѕРјРµСЂР°, Р° Р·Р°С‚РµРј СЃРѕС…СЂР°РЅРёС‚Рµ РµРіРѕ РІ РѕР±СЉРµРєС‚.</p>
          </div>
        </div>

        <form action={createOwnerRoom} className="br-owner-editor br-owner-editor--muted">
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="br-property-form__grid">
            <Input id="room-title-new" name="title" label="РќР°Р·РІР°РЅРёРµ РЅРѕРјРµСЂР°" />
            <Input id="room-subtitle-new" name="subtitle" label="РџРѕРґР·Р°РіРѕР»РѕРІРѕРє" />
            <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Р“РѕСЃС‚РµР№" defaultValue="2" />
            <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="РЎРїР°Р»РµРЅ" defaultValue="1" />
            <Input id="room-area-new" name="area" type="number" min="0" label="РџР»РѕС‰Р°РґСЊ, РјВІ" defaultValue="0" />
            <Input
              id="room-price-new"
              name="pricePerNight"
              type="number"
              min="0"
              step="0.01"
              label="Р‘Р°Р·РѕРІР°СЏ С†РµРЅР° Р·Р° РЅРѕС‡СЊ"
              defaultValue="0"
            />
          </div>
          <RoomAmenitiesField initialAmenities={[]} />
          <label className="br-toggle">
            <span>РќРѕРјРµСЂ Р°РєС‚РёРІРµРЅ</span>
            <input type="checkbox" name="isActive" defaultChecked />
          </label>
          <div className="br-active-step__actions">
            <Button type="submit">РЎРѕС…СЂР°РЅРёС‚СЊ РЅРѕРјРµСЂ</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
