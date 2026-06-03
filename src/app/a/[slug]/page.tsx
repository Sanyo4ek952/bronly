import { notFound } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
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

function buildAgentRequestHref(agentSlug: string, propertySlug: string, roomId: string, query: URLSearchParams) {
  query.set("propertySlug", propertySlug);
  query.set("roomId", roomId);

  return `/a/${agentSlug}/request?${query.toString()}`;
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

  if (pageData.publicUnavailableReason === "subscription_expired" || !pageData.agent) {
    return (
      <main className="br-page">
        <div className="br-container">
          <section className="br-request-success br-card" style={{ margin: "48px auto" }}>
            <h1>Страница временно недоступна</h1>
            <p>Доступ к агентской витрине временно ограничен. Попробуйте открыть ссылку позже.</p>
            <div className="br-request-success__actions">
              <ButtonLink href="/" fullWidth>
                На главную
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
            <p>Агентская витрина Bronly. Агент принимает заявку и передает ее владельцу вручную.</p>
          </div>
          <div className="br-public-hero__actions">
            {agent.phone ? <Button variant="secondary">{agent.phone}</Button> : null}
            {agent.telegram ? <Button variant="secondary">{agent.telegram}</Button> : null}
          </div>
        </header>

        {publicWarningText ? <div className="br-inline-notice">{publicWarningText}</div> : null}

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
                  propertySlug={section.property.slug}
                  rooms={section.rooms}
                  filters={filters}
                  resetHref={`/a/${agent.slug}`}
                  requestHrefBuilder={(roomId, currentFilters) => {
                    const requestQuery = new URLSearchParams();

                    if (currentFilters.hasDates) {
                      requestQuery.set("checkIn", currentFilters.checkIn);
                      requestQuery.set("checkOut", currentFilters.checkOut);
                    }

                    requestQuery.set("adults", String(currentFilters.adults));
                    requestQuery.set("rooms", String(currentFilters.rooms));

                    return buildAgentRequestHref(agent.slug, section.property.slug, roomId, requestQuery);
                  }}
                />
              </section>
            ))}
          </div>
        ) : (
          <section className="br-dashboard-block br-card">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Пока нет доступных объектов</h2>
                <p>Агентская витрина появится после активного сотрудничества с владельцем.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
