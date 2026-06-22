import type { Metadata } from "next";
import { CircleCheckBig } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import {
  buildPublicRequestSummary,
  getPublicRequestSuccessSteps,
} from "@/features/request/submit-request/model/public-request-ui";
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
  const filters = {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  };
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicAgentPageData(slug, filters);

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
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const steps = getPublicRequestSuccessSteps("agent", pageData.agent.phone);

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          {summary
            ? `Заявка на номер «${summary.roomTitle}» отправлена. Агент получит её и свяжется с вами, чтобы уточнить детали.`
            : "Заявка отправлена. Агент получит её и свяжется с вами, чтобы уточнить детали."}
        </p>

        {summary ? (
          <section className="br-request-success__summary">
            <div>
              <span>Номер</span>
              <strong>{summary.roomTitle}</strong>
              {summary.propertyTitle ? <small>{summary.propertyTitle}</small> : null}
            </div>
            <div>
              <span>Даты</span>
              <strong>{summary.checkIn && summary.checkOut ? `${summary.checkIn} - ${summary.checkOut}` : "Уточняются"}</strong>
              <small>
                {summary.guestsLabel} • {summary.roomsLabel}
              </small>
            </div>
            <div>
              <span>Цена</span>
              <strong>{summary.priceLabel}</strong>
              <small>{summary.priceCaption}</small>
            </div>
          </section>
        ) : null}

        <section className="br-request-success__steps">
          <h2>Что дальше</h2>
          <ol>
            {steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="br-request-success__actions">
          <ButtonLink href={`/a/${pageData.agent.publicId}`} fullWidth>
            Вернуться к витрине
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            На главную
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
