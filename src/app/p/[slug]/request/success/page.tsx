import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

type PublicRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PublicRequestSuccessPage({ params, searchParams }: PublicRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug.shouldRedirect) {
    const redirectQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        redirectQuery.set(key, value);
      }
    }

    redirect(`/p/${resolvedSlug.ownerSlug}/request/success${redirectQuery.size ? `?${redirectQuery.toString()}` : ""}`);
  }

  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug);

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.owner) {
    const unavailable = getPublicUnavailableContent("ownerRequest", pageData.publicUnavailableReason);

    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>{unavailable.title}</h1>
          <p>{unavailable.description}</p>
          <div className="br-request-success__actions">
            {unavailable.showLogin ? (
              <ButtonLink href="/login" fullWidth>
                Р’РѕР№С‚Рё РІ РєР°Р±РёРЅРµС‚
              </ButtonLink>
            ) : null}
            <ButtonLink href="/" variant="secondary" fullWidth>
              РќР° РіР»Р°РІРЅСѓСЋ
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const selectedSection = pageData.properties.find((section) => section.property.slug === propertySlug) ?? pageData.properties[0];
  const selectedRoom = selectedSection?.rooms.find((room) => room.id === roomId) ?? null;
  const roomSummary = selectedSection && selectedRoom ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}` : "выбранный номер";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon">вњ“</div>
        <h1>Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°</h1>
        <p>
          Р—Р°СЏРІРєР° РЅР° {roomSummary} РѕС‚РїСЂР°РІР»РµРЅР°. Р’Р»Р°РґРµР»РµС† РїРѕР»СѓС‡РёР» РІР°С€ Р·Р°РїСЂРѕСЃ РЅР° РїСЂРѕР¶РёРІР°РЅРёРµ Рё СЃРІСЏР¶РµС‚СЃСЏ СЃ РІР°РјРё, С‡С‚РѕР±С‹ СѓС‚РѕС‡РЅРёС‚СЊ
          РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ.
          {pageData.owner.phone ? ` Р РµРєРѕРјРµРЅРґСѓРµРј СЃРѕС…СЂР°РЅРёС‚СЊ РЅРѕРјРµСЂ ${pageData.owner.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href="/" fullWidth>
            РџРµСЂРµР№С‚Рё РЅР° РіР»Р°РІРЅСѓСЋ
          </ButtonLink>
          <ButtonLink href={`/p/${pageData.owner.slug}`} variant="secondary" fullWidth>
            РџРѕСЃРјРѕС‚СЂРµС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РІР»Р°РґРµР»СЊС†Р°
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
