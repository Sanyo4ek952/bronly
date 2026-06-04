import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

type CollectionRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function CollectionRequestSuccessPage({ params, searchParams }: CollectionRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicCollectionPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.collection || !pageData.contact) {
    const unavailable = getPublicUnavailableContent("collection", pageData.publicUnavailableReason);

    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>{unavailable.title}</h1>
          <p>{unavailable.description}</p>
          <div className="br-request-success__actions">
            <ButtonLink href="/" fullWidth>
              РќР° РіР»Р°РІРЅСѓСЋ
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const selectedSection = pageData.sections.find((section) => section.property.slug === propertySlug) ?? pageData.sections[0];
  const selectedRoom = selectedSection?.rooms.find((room) => room.id === roomId) ?? null;
  const roomSummary = selectedSection && selectedRoom ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}` : "выбранный номер";
  const isAgentCollection = pageData.collection.creatorRole === "agent";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon">вњ“</div>
        <h1>Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°</h1>
        <p>
          Р—Р°СЏРІРєР° РЅР° {roomSummary} РѕС‚РїСЂР°РІР»РµРЅР°.
          {isAgentCollection
            ? ` РђРіРµРЅС‚ ${pageData.contact.displayName} РїРѕР»СѓС‡РёР» РІР°С€ Р·Р°РїСЂРѕСЃ РЅР° РїСЂРѕР¶РёРІР°РЅРёРµ Рё РІСЂСѓС‡РЅСѓСЋ РїРµСЂРµРґР°СЃС‚ РµРіРѕ РІР»Р°РґРµР»СЊС†Сѓ, С‡С‚РѕР±С‹ СѓС‚РѕС‡РЅРёС‚СЊ РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ.`
            : " Р’Р»Р°РґРµР»РµС† РїРѕР»СѓС‡РёР» РІР°С€ Р·Р°РїСЂРѕСЃ РЅР° РїСЂРѕР¶РёРІР°РЅРёРµ Рё СЃРІСЏР¶РµС‚СЃСЏ СЃ РІР°РјРё, С‡С‚РѕР±С‹ СѓС‚РѕС‡РЅРёС‚СЊ РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ."}
          {pageData.contact.phone ? ` РЎРѕС…СЂР°РЅРёС‚Рµ РЅРѕРјРµСЂ ${pageData.contact.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/c/${pageData.collection.slug}`} fullWidth>
            Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє РєРѕР»Р»РµРєС†РёРё
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            РќР° РіР»Р°РІРЅСѓСЋ
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
