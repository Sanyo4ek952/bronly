import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteOwnerProperty,
  deletePropertyPhoto,
  setPropertyPhotoPrimary,
  updateOwnerProperty,
  uploadPropertyPhoto,
} from "@/app/dashboard/properties/actions";
import { getPropertyNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav, Input, StatusPill } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getPropertyNotice(error, success);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: property.title }])}
        compact
      />

      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>
              {property.city} вЂў {property.propertyType} вЂў slug РѕР±СЉРµРєС‚Р°: {property.slug}
            </p>
          </div>
          <div className="br-owner-actions">
            <StatusPill variant={property.published && !property.isFrozen ? "active" : "inactive"}>
              {property.isFrozen ? "Р—Р°РјРѕСЂРѕР¶РµРЅ" : property.published ? "РћРїСѓР±Р»РёРєРѕРІР°РЅ" : "РЎРєСЂС‹С‚"}
            </StatusPill>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="property" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>РќР°СЃС‚СЂРѕР№РєРё РѕР±СЉРµРєС‚Р°</h2>
            <p>РћСЃРЅРѕРІРЅС‹Рµ РґР°РЅРЅС‹Рµ, РєРѕРЅС‚Р°РєС‚С‹, РїСЂР°РІРёР»Р° РїСЂРѕР¶РёРІР°РЅРёСЏ Рё РїР°СЂР°РјРµС‚СЂС‹ РїСѓР±Р»РёРєР°С†РёРё.</p>
          </div>
        </div>

        <form action={updateOwnerProperty} className="br-owner-stack">
          <input type="hidden" name="propertyId" value={property.id} />
          <OwnerPropertyFormFields property={property} />

          <div className="br-active-step__actions">
            <Button type="submit">РЎРѕС…СЂР°РЅРёС‚СЊ РѕР±СЉРµРєС‚</Button>
            <Link
              href={property.ownerPublicSlug ? `/p/${property.ownerPublicSlug}` : "/dashboard/settings"}
              className="br-button br-button--secondary"
            >
              {property.ownerPublicSlug ? "РћС‚РєСЂС‹С‚СЊ РїСѓР±Р»РёС‡РЅСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ" : "Р—Р°РїРѕР»РЅРёС‚СЊ slug РІР»Р°РґРµР»СЊС†Р°"}
            </Link>
          </div>
        </form>
      </section>

      <section id="photos" className="br-dashboard-block br-card br-anchor-target">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Р¤РѕС‚Рѕ РѕР±СЉРµРєС‚Р°</h2>
            <p>Р”РѕР±Р°РІСЊС‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ С„РѕС‚Рѕ. РџРµСЂРІРѕРµ С„РѕС‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє РѕР±Р»РѕР¶РєР° РІ РєР°Р±РёРЅРµС‚Рµ Рё РЅР° РїСѓР±Р»РёС‡РЅРѕР№ СЃС‚СЂР°РЅРёС†Рµ.</p>
          </div>
        </div>

        <form action={uploadPropertyPhoto} className="br-owner-photo-upload" encType="multipart/form-data">
          <input type="hidden" name="propertyId" value={property.id} />
          <Input
            id="property-photo-upload"
            name="photo"
            type="file"
            accept="image/*"
            label="Р”РѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ РѕР±СЉРµРєС‚Р°"
            wrapperClassName="br-owner-photo-upload__field"
          />
          <p className="br-owner-muted">РџРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ JPG, PNG, WebP Рё GIF РґРѕ 5 РњР‘.</p>
          <Button type="submit">Р—Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ</Button>
        </form>

        {property.photos.length ? (
          <div className="br-photo-grid">
            {property.photos.map((photo, index) => (
              <article key={photo.id} className="br-photo-card">
                <div className="br-photo-card__media">
                  <Image
                    src={photo.url}
                    alt={`${property.title} вЂ” С„РѕС‚Рѕ ${index + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="br-photo-card__image"
                  />
                </div>
                <div className="br-photo-card__body">
                  <div className="br-photo-card__meta">
                    <strong>{index === 0 ? "РћР±Р»РѕР¶РєР° РѕР±СЉРµРєС‚Р°" : `Р¤РѕС‚Рѕ ${index + 1}`}</strong>
                    <span>{index === 0 ? "РџРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РїРµСЂРІРѕР№" : "РњРѕР¶РЅРѕ СЃРґРµР»Р°С‚СЊ РѕР±Р»РѕР¶РєРѕР№"}</span>
                  </div>
                  <div className="br-photo-card__actions">
                    <form action={setPropertyPhotoPrimary}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="secondary" disabled={index === 0}>
                        {index === 0 ? "РћР±Р»РѕР¶РєР°" : "РЎРґРµР»Р°С‚СЊ РѕР±Р»РѕР¶РєРѕР№"}
                      </Button>
                    </form>
                    <form action={deletePropertyPhoto}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="danger">
                        РЈРґР°Р»РёС‚СЊ
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="br-owner-muted">
            Р¤РѕС‚Рѕ РѕР±СЉРµРєС‚Р° РїРѕРєР° РЅРµС‚. РџРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё РїРµСЂРІРѕРµ С„РѕС‚Рѕ СЃС‚Р°РЅРµС‚ РѕР±Р»РѕР¶РєРѕР№ РІ РєР°Р±РёРЅРµС‚Рµ Рё РЅР° РїСѓР±Р»РёС‡РЅРѕР№ СЃС‚СЂР°РЅРёС†Рµ.
          </p>
        )}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>РЈРґР°Р»РµРЅРёРµ РѕР±СЉРµРєС‚Р°</h2>
            <p>РЈРґР°Р»РµРЅРёРµ РєР°СЃРєР°РґРЅРѕ СѓРґР°Р»РёС‚ РЅРѕРјРµСЂР°, СЃРµР·РѕРЅРЅС‹Рµ С†РµРЅС‹, Р·Р°РЅСЏС‚С‹Рµ РґР°С‚С‹ Рё СЃРІСЏР·Р°РЅРЅС‹Рµ СЃРїРёСЃРєРё.</p>
          </div>
        </div>

        <form action={deleteOwnerProperty} className="br-owner-danger">
          <input type="hidden" name="propertyId" value={property.id} />
          <Input
            id="property-delete-confirmation"
            name="confirmation"
            label="Р’РІРµРґРёС‚Рµ DELETE РґР»СЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ"
            placeholder="DELETE"
          />
          <Button type="submit" variant="danger">
            РЈРґР°Р»РёС‚СЊ РѕР±СЉРµРєС‚
          </Button>
        </form>
      </section>
    </section>
  );
}
