import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { Button, ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicAgentPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function buildAgentRequestHref(agentPublicId: string, propertySlug: string, roomId: string, query: URLSearchParams) {
  query.set("propertySlug", propertySlug);
  query.set("roomId", roomId);

  return `/a/${agentPublicId}/request?${query.toString()}`;
}

export default async function PublicAgentPage({ params, searchParams }: PublicAgentPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const pageData = await getPublicAgentPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

  if (!pageData) {
    notFound();
  }

  if (pageData.shouldRedirectToCanonical && pageData.agent?.publicId) {
    redirect(`/a/${pageData.agent.publicId}`);
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return (
      <main className="br-page">
        <div className="br-container">
          <section className="br-request-success br-card" style={{ margin: "48px auto" }}>
            <h1>{unavailable.title}</h1>
            <p>{unavailable.description}</p>
            <div className="br-request-success__actions">
              <ButtonLink href="/" fullWidth>
                РќР° РіР»Р°РІРЅСѓСЋ
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { agent, properties, filters, publicWarningText } = pageData;

  return (
    <main className="br-page">
      <div className="br-container">
        <header className="br-header br-header--public">
          <div>
            <h1>{agent.displayName}</h1>
            <p>РђРіРµРЅС‚СЃРєР°СЏ РІРёС‚СЂРёРЅР° Bronly. РђРіРµРЅС‚ РїСЂРёРЅРёРјР°РµС‚ Р·Р°СЏРІРєСѓ Рё РїРµСЂРµРґР°РµС‚ РµРµ РІР»Р°РґРµР»СЊС†Сѓ РІСЂСѓС‡РЅСѓСЋ.</p>
          </div>
          <div className="br-public-hero__actions">
            {agent.phone ? <Button variant="secondary">{agent.phone}</Button> : null}
            {agent.telegram ? <Button variant="secondary">{agent.telegram}</Button> : null}
          </div>
        </header>

        {publicWarningText ? <div className="br-inline-notice">{publicWarningText}</div> : null}
        <div className="br-inline-notice br-inline-notice--soft">
          Р’ Р°РіРµРЅС‚СЃРєРѕР№ РІРёС‚СЂРёРЅРµ РїРѕРєР°Р·Р°РЅР° РёС‚РѕРіРѕРІР°СЏ С†РµРЅР° Р°РіРµРЅС‚Р°. Р‘Р°Р·РѕРІСѓСЋ С†РµРЅСѓ РІР»Р°РґРµР»СЊС†Р° Р°РіРµРЅС‚ РЅРµ РјРµРЅСЏРµС‚.
        </div>

        {properties.length ? (
          <div className="br-owner-stack">
            {properties.map((section) => (
              <section key={section.property.id} className="br-dashboard-block br-card">
                <div className="br-dashboard-block__header">
                  <div>
                    <h2>{section.property.shortTitle}</h2>
                    <p>
                      {section.property.city}, {section.property.address}
                    </p>
                  </div>
                </div>

                <PublicRoomBrowser
                  publicBaseHref={`/a/${agent.publicId}`}
                  propertySlug={section.property.slug}
                  rooms={section.rooms}
                  filters={filters}
                  requestHrefBuilder={(roomId, currentFilters) => {
                    const requestQuery = new URLSearchParams();

                    if (currentFilters.hasDates) {
                      requestQuery.set("checkIn", currentFilters.checkIn);
                      requestQuery.set("checkOut", currentFilters.checkOut);
                    }

                    requestQuery.set("adults", String(currentFilters.adults));
                    requestQuery.set("rooms", String(currentFilters.rooms));

                    return buildAgentRequestHref(agent.publicId, section.property.slug, roomId, requestQuery);
                  }}
                />
              </section>
            ))}
          </div>
        ) : (
          <section className="br-dashboard-block br-card">
            <div className="br-dashboard-block__header">
              <div>
                <h2>РџРѕРєР° РЅРµС‚ РґРѕСЃС‚СѓРїРЅС‹С… РѕР±СЉРµРєС‚РѕРІ</h2>
                <p>РђРіРµРЅС‚СЃРєР°СЏ РІРёС‚СЂРёРЅР° РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ Р°РєС‚РёРІРЅРѕРіРѕ СЃРѕС‚СЂСѓРґРЅРёС‡РµСЃС‚РІР° СЃ РІР»Р°РґРµР»СЊС†РµРј.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
