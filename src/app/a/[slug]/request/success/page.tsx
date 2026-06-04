import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

type AgentRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AgentRequestSuccessPage({ params, searchParams }: AgentRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const pageData = await getPublicAgentPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>{unavailable.title}</h1>
          <p>{unavailable.description}</p>
          <div className="br-request-success__actions">
            <ButtonLink href="/" fullWidth>
              На главную
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const propertyTitle =
    pageData.properties.find((property) => property.property.slug === propertySlug)?.property.shortTitle ?? "объект";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon">✓</div>
        <h1>Заявка отправлена</h1>
        <p>
          Агент {pageData.agent.displayName} получил ваш запрос на проживание по объекту {propertyTitle} и вручную
          передаст его владельцу для уточнения доступности.
          {pageData.agent.phone ? ` Сохраните номер ${pageData.agent.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/a/${pageData.agent.slug}`} fullWidth>
            Вернуться к витрине
          </ButtonLink>
          <Link href="/" className="br-button br-button--secondary br-button--full">
            На главную
          </Link>
        </div>
      </Panel>
    </main>
  );
}
