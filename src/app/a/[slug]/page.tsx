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
                На главную
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { agent, properties, standaloneRooms, filters, publicWarningText } = pageData;

  return (
    <main className="br-page">
      <div className="br-container">
        <header className="br-header br-header--public">
          <div>
            <h1>{agent.displayName}</h1>
            <p>Агентская витрина Bronly. Агент принимает заявку и вручную передает ее владельцу для уточнения доступности.</p>
          </div>
          <div className="br-public-hero__actions">
            {agent.phone ? <Button variant="secondary">{agent.phone}</Button> : null}
            {agent.telegram ? <Button variant="secondary">{agent.telegram}</Button> : null}
          </div>
        </header>

        {publicWarningText ? <div className="br-inline-notice">{publicWarningText}</div> : null}
        <div className="br-inline-notice br-inline-notice--soft">
          В агентской витрине показана итоговая цена агента. Базовую цену владельца агент не меняет.
        </div>

        {properties.length || standaloneRooms.length ? (
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
                />
              </section>
            ))}

            {standaloneRooms.length ? (
              <section className="br-dashboard-block br-card">
                <div className="br-dashboard-block__header">
                  <div>
                    <h2>Отдельные номера</h2>
                    <p>Самостоятельные варианты размещения без привязки к объекту.</p>
                  </div>
                </div>

                <PublicRoomBrowser publicBaseHref={`/a/${agent.publicId}`} rooms={standaloneRooms} filters={filters} />
              </section>
            ) : null}
          </div>
        ) : (
          <section className="br-dashboard-block br-card">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Пока нет доступных вариантов</h2>
                <p>Агентская витрина появится после активного сотрудничества с владельцем.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
