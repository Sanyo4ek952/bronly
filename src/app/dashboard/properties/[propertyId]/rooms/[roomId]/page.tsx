import Image from "next/image";
import { notFound } from "next/navigation";

import { formatMoney } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, StatusPill } from "@/shared/ui";

type PropertyRoomPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
};

export default async function PropertyRoomPage({ params }: PropertyRoomPageProps) {
  const { propertyId, roomId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const room = property.rooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: room.title },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{property.title}</p>
            <h2>{room.title}</h2>
            <p>РЎС‚СЂР°РЅРёС†Р° РЅРѕРјРµСЂР° СЃ РєСЂР°С‚РєРѕР№ СЃРІРѕРґРєРѕР№, С„РѕС‚Рѕ Рё РїРµСЂРµС…РѕРґРѕРј РІ РЅР°СЃС‚СЂРѕР№РєРё.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}>РќР°СЃС‚СЂРѕР№РєРё</ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card br-room-page-hero">
        <div className="br-room-page-hero__media">
          {room.photos[0] ? (
            <Image
              src={room.photos[0].url}
              alt={`${room.title} вЂ” РіР»Р°РІРЅРѕРµ С„РѕС‚Рѕ`}
              width={1600}
              height={960}
              unoptimized
              className="br-room-page-hero__image"
            />
          ) : (
            <div className="br-room-page-hero__placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="br-room-page-hero__content">
          <div className="br-room-page-hero__header">
            <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "РђРєС‚РёРІРµРЅ" : "РќРµР°РєС‚РёРІРµРЅ"}</StatusPill>
            <strong className="br-room-page__price">{formatMoney(room.pricePerNight)} / РЅРѕС‡СЊ</strong>
          </div>
          {room.subtitle ? <p>{room.subtitle}</p> : null}
          <div className="br-selected-room-meta">
            <span>{room.capacity} РіРѕСЃС‚СЏ</span>
            <span>{room.bedrooms} СЃРїР°Р»СЊРЅРё</span>
            <span>{room.area} РјВІ</span>
            <span>Р¤РѕС‚Рѕ: {room.photos.length}</span>
            <span>РЎРµР·РѕРЅРЅС‹С… С†РµРЅ: {room.seasonalPrices.length}</span>
            <span>Р—Р°РЅСЏС‚С‹С… РґРёР°РїР°Р·РѕРЅРѕРІ: {room.busyRanges.length}</span>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Р§С‚Рѕ РјРѕР¶РЅРѕ СЃРґРµР»Р°С‚СЊ</h2>
            <p>РћСЃРЅРѕРІРЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РїРѕ РЅРѕРјРµСЂСѓ РІС‹РЅРµСЃРµРЅС‹ РЅР° РѕС‚РґРµР»СЊРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹.</p>
          </div>
        </div>

        <div className="br-quick-grid br-quick-grid--rooms">
          <article className="br-quick-card">
            <strong>РќР°СЃС‚СЂРѕР№РєРё РЅРѕРјРµСЂР°</strong>
            <p>РћР±РЅРѕРІРёС‚Рµ РЅР°Р·РІР°РЅРёРµ, РІРјРµСЃС‚РёРјРѕСЃС‚СЊ, Р±Р°Р·РѕРІСѓСЋ С†РµРЅСѓ, СЃРµР·РѕРЅРЅС‹Рµ С†РµРЅС‹ Рё С„РѕС‚Рѕ.</p>
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`} variant="secondary">
              РћС‚РєСЂС‹С‚СЊ РЅР°СЃС‚СЂРѕР№РєРё
            </ButtonLink>
          </article>
          <article className="br-quick-card">
            <strong>РљР°Р»РµРЅРґР°СЂСЊ Р·Р°РЅСЏС‚РѕСЃС‚Рё</strong>
            <p>Р—Р°РЅСЏС‚С‹Рµ РґР°С‚С‹ РїРѕ СЌС‚РѕРјСѓ РЅРѕРјРµСЂСѓ СѓРїСЂР°РІР»СЏСЋС‚СЃСЏ РІ РѕР±С‰РµРј РєР°Р»РµРЅРґР°СЂРµ РѕР±СЉРµРєС‚Р°.</p>
            <ButtonLink href={`/dashboard/properties/${property.id}/calendar`} variant="secondary">
              РћС‚РєСЂС‹С‚СЊ РєР°Р»РµРЅРґР°СЂСЊ
            </ButtonLink>
          </article>
        </div>
      </section>

      {room.amenities.length ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>РЈРґРѕР±СЃС‚РІР°</h2>
              <p>РЎРїРёСЃРѕРє СѓРґРѕР±СЃС‚РІ, РєРѕС‚РѕСЂС‹Рµ РїРѕРєР°Р·С‹РІР°СЋС‚СЃСЏ РІ РєР°СЂС‚РѕС‡РєРµ РЅРѕРјРµСЂР°.</p>
            </div>
          </div>
          <div className="br-room-amenities">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="br-room-amenity-chip">
                {amenity}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
