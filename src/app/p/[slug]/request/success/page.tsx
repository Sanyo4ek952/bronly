import type { Metadata } from "next";
import { CircleCheckBig } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import {
  buildPublicRequestSummary,
  getPublicRequestSuccessSteps,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { encodePublicPathSegment } from "@/shared/lib/public-links";
import { createSeoMetadata } from "@/shared/lib/seo";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type PublicRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки в Bronly.",
  path: "/p/request/success",
  index: false,
});

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

    redirect(
      `/p/${encodePublicPathSegment(resolvedSlug.ownerSlug)}/request/success${redirectQuery.size ? `?${redirectQuery.toString()}` : ""}`,
    );
  }

  const filters = {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  };
  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug, filters);

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
                Войти в кабинет
              </ButtonLink>
            ) : null}
            <ButtonLink href="/" variant="secondary" fullWidth>
              На главную
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const selectedSection = propertySlug ? pageData.properties.find((section) => section.property.slug === propertySlug) ?? null : null;
  const selectedRoom =
    selectedSection?.rooms.find((room) => room.id === roomId) ?? pageData.standaloneRooms.find((room) => room.id === roomId) ?? null;
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const steps = getPublicRequestSuccessSteps("owner", pageData.owner.phone);

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          {summary
            ? `Заявка на номер «${summary.roomTitle}» отправлена. Владелец свяжется с вами, чтобы уточнить доступность.`
            : "Заявка отправлена. Владелец свяжется с вами, чтобы уточнить доступность."}
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
          <ButtonLink href={`/p/${pageData.owner.slug}`} fullWidth>
            Вернуться к странице
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            На главную
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
