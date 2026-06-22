import type { Metadata } from "next";
import { CircleCheckBig } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import {
  buildPublicRequestSummary,
  getPublicRequestSuccessSteps,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { createSeoMetadata } from "@/shared/lib/seo";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type CollectionRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки из коллекции в Bronly.",
  path: "/c/request/success",
  index: false,
});

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function CollectionRequestSuccessPage({ params, searchParams }: CollectionRequestSuccessPageProps) {
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
  const pageData = await getPublicCollectionPageData(slug, filters);

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
              На главную
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const selectedSection = propertySlug ? pageData.sections.find((section) => section.property.slug === propertySlug) ?? null : null;
  const selectedRoom =
    pageData.standaloneRooms.find((item) => item.room.id === roomId)?.room ??
    selectedSection?.rooms.find((room) => room.id === roomId) ??
    null;
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const contextKind = pageData.collection.creatorRole === "agent" ? "collection-agent" : "collection-owner";
  const steps = getPublicRequestSuccessSteps(contextKind, pageData.contact.phone);

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          {summary
            ? `Заявка на номер «${summary.roomTitle}» из подборки отправлена. ${
                contextKind === "collection-agent"
                  ? "Агент получит её и при необходимости передаст владельцу для уточнения доступности."
                  : "Владелец свяжется с вами, чтобы уточнить доступность."
              }`
            : "Заявка отправлена. С вами свяжутся, чтобы уточнить доступность."}
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
          <ButtonLink href={`/c/${pageData.collection.slug}`} fullWidth>
            Вернуться к подборке
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            На главную
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
