import Link from "next/link";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, DashboardPageNav, Input, Textarea } from "@/shared/ui";

type StandaloneRoomCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StandaloneRoomCreatePage({ searchParams }: StandaloneRoomCreatePageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const notice = getRoomCreateNotice(error);
  const profile = await getCurrentAuthProfile();

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: "Новый номер" },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>РќРѕРІС‹Р№ РѕС‚РґРµР»СЊРЅС‹Р№ РЅРѕРјРµСЂ</h2>
            <p>РЎРѕР·РґР°Р№С‚Рµ СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ РЅРѕРјРµСЂ Р±РµР· РѕР±СЉРµРєС‚Р°. РћРЅ РїРѕРїР°РґРµС‚ РІ РѕР±С‰РёР№ СЃРїРёСЃРѕРє Рё РІ РѕС‚РґРµР»СЊРЅС‹Р№ Р±Р»РѕРє РЅР° РїСѓР±Р»РёС‡РЅРѕР№ СЃС‚СЂР°РЅРёС†Рµ РІР»Р°РґРµР»СЊС†Р°.</p>
          </div>
        </div>
        {notice ? <div className="br-inline-notice">{notice}</div> : null}
        {profile ? <div className="br-owner-muted">РџРѕРґРїРёСЃРєР° СѓС‡РёС‚С‹РІР°РµС‚ СЌС‚РѕС‚ РЅРѕРјРµСЂ РІ РѕР±С‰РµРј Р»РёРјРёС‚Рµ Р°РєС‚РёРІРЅС‹С… РЅРѕРјРµСЂРѕРІ.</div> : null}
      </section>

      <section className="br-dashboard-block br-card">
        <form action={createOwnerRoom} className="br-owner-stack">
          <div className="br-property-form__grid">
            <Input id="room-title-new" name="title" label="РќР°Р·РІР°РЅРёРµ РЅРѕРјРµСЂР°" />
            <Input id="room-subtitle-new" name="subtitle" label="РџРѕРґР·Р°РіРѕР»РѕРІРѕРє" />
            <Input id="room-type-new" name="propertyType" label="РўРёРї СЂР°Р·РјРµС‰РµРЅРёСЏ" />
            <Input id="room-city-new" name="city" label="Р“РѕСЂРѕРґ" />
            <Input id="room-timezone-new" name="timezone" label="Р§Р°СЃРѕРІРѕР№ РїРѕСЏСЃ" defaultValue="(UTC+03:00) РњРѕСЃРєРІР°" />
            <Input id="room-address-new" name="address" label="РђРґСЂРµСЃ" wrapperClassName="br-form-field--span-2" />
            <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Р“РѕСЃС‚РµР№" defaultValue="2" />
            <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="РЎРїР°Р»РµРЅ" defaultValue="1" />
            <Input id="room-area-new" name="area" type="number" min="0" label="РџР»РѕС‰Р°РґСЊ, РјВІ" defaultValue="0" />
            <Input id="room-price-new" name="pricePerNight" type="number" min="0" step="0.01" label="Р‘Р°Р·РѕРІР°СЏ С†РµРЅР° Р·Р° РЅРѕС‡СЊ" defaultValue="0" />
          </div>

          <Textarea id="room-short-description-new" name="shortDescription" label="РљСЂР°С‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ" />
          <Textarea id="room-full-description-new" name="fullDescription" label="РџРѕРґСЂРѕР±РЅРѕРµ РѕРїРёСЃР°РЅРёРµ" className="br-textarea--lg" />
          <RoomAmenitiesField initialAmenities={[]} />

          <div className="br-inline-fields">
            <Input id="room-phone-new" name="phone" label="РўРµР»РµС„РѕРЅ" />
            <Input id="room-whatsapp-new" name="whatsapp" label="WhatsApp" />
            <Input id="room-telegram-new" name="telegram" label="Telegram" />
          </div>

          <div className="br-inline-fields">
            <Input id="room-check-in-new" name="checkInTime" label="Р—Р°РµР·Рґ" />
            <Input id="room-check-out-new" name="checkOutTime" label="Р’С‹РµР·Рґ" />
          </div>

          <div className="br-toggle-list">
            <label className="br-toggle">
              <span>РќРѕРјРµСЂ Р°РєС‚РёРІРµРЅ</span>
              <input type="checkbox" name="isActive" defaultChecked />
            </label>
            <label className="br-toggle">
              <span>Р“РѕС‚РѕРІ СЃРѕС‚СЂСѓРґРЅРёС‡Р°С‚СЊ СЃ Р°РіРµРЅС‚Р°РјРё</span>
              <input type="checkbox" name="allowAgentInquiries" />
            </label>
            <label className="br-toggle">
              <span>РџРѕРєР°Р·С‹РІР°С‚СЊ РєРѕРЅС‚Р°РєС‚С‹ РІР»Р°РґРµР»СЊС†Р° Р°РіРµРЅС‚Сѓ</span>
              <input type="checkbox" name="allowOwnerContactSharing" />
            </label>
          </div>

          <div className="br-active-step__actions">
            <Link href="/dashboard/properties" className="br-button br-button--secondary">
              Рљ РѕР±С‰РµРјСѓ СЃРїРёСЃРєСѓ
            </Link>
            <Button type="submit">РЎРѕР·РґР°С‚СЊ РЅРѕРјРµСЂ</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
