import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { encodePublicPathSegment } from "@/shared/lib/public-links";
import { createSeoMetadata } from "@/shared/lib/seo";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type AgentRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки по ссылке агента в Bronly.",
  path: "/a/request/success",
  index: false,
});

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AgentRequestSuccessPage({ params, searchParams }: AgentRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicAgentPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.shouldRedirectToCanonical && pageData.agent?.publicId) {
    const redirectQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value) {
        redirectQuery.set(key, value);
      }
    }

    const suffix = redirectQuery.toString();
    redirect(`/a/${encodePublicPathSegment(pageData.agent.publicId)}/request/success${suffix ? `?${suffix}` : ""}`);
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

  const selectedSection = propertySlug
    ? pageData.properties.find((property) => property.property.slug === propertySlug) ?? null
    : null;
  const selectedRoom =
    pageData.standaloneRooms.find((room) => room.id === roomId) ??
    selectedSection?.rooms.find((room) => room.id === roomId) ??
    null;
  const roomSummary = selectedRoom
    ? selectedSection
      ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}`
      : selectedRoom.title
    : "Выбранный номер";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          Заявка на {roomSummary} отправлена. Агент {pageData.agent.displayName} получит ваш запрос на проживание и при
          необходимости передаст его владельцу, чтобы уточнить доступность.
          {pageData.agent.phone ? ` Рекомендуем сохранить номер ${pageData.agent.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/a/${pageData.agent.publicId}`} fullWidth>
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
