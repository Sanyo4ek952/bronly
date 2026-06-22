import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { GuestRequestForm } from "@/features/request/submit-request";
import {
  findRequestRoom,
  getPublicRequestContextMessage,
  getPublicRequestErrorText,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { encodePublicPathSegment } from "@/shared/lib/public-links";
import { createSeoMetadata } from "@/shared/lib/seo";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitAgentGuestRequestAction } from "./actions";

type AgentRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка через агента",
  description: "Форма отправки заявки на проживание по ссылке агента в Bronly.",
  path: "/a/request",
  index: false,
});

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AgentRequestPage({ params, searchParams }: AgentRequestPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
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
    const redirectQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value) {
        redirectQuery.set(key, value);
      }
    }

    const suffix = redirectQuery.toString();
    redirect(`/a/${encodePublicPathSegment(pageData.agent.publicId)}/request${suffix ? `?${suffix}` : ""}`);
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

  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection =
    pageData.properties.find((property) => property.property.slug === propertySlug) ??
    (propertySlug ? null : pageData.properties[0] ?? null);
  const standaloneActiveRooms = pageData.standaloneRooms.filter((room) => room.status === "active");
  const propertyActiveRooms = selectedSection?.rooms.filter((room) => room.status === "active") ?? [];
  const activeRooms = propertySlug ? propertyActiveRooms : standaloneActiveRooms;
  const hasRequestedRoom = Boolean(requestedRoomId);
  const requestedRoomIsValid = hasRequestedRoom ? activeRooms.some((room) => room.id === requestedRoomId) : true;
  const defaultRoomId =
    (requestedRoomIsValid ? activeRooms.find((room) => room.id === requestedRoomId)?.id : undefined) ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";
  const error = requestedError || (!requestedRoomIsValid ? "room" : "");
  const selectedRoom = findRequestRoom(activeRooms, defaultRoomId);

  if (!activeRooms.length) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Сейчас нет доступных номеров</h1>
          <p>По этой витрине сейчас нельзя оставить заявку. Вернитесь и выберите другой вариант.</p>
          <div className="br-request-success__actions">
            <ButtonLink href={`/a/${pageData.agent.publicId}`} fullWidth>
              Вернуться к витрине
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="br-auth-page">
      <Panel className="br-request-modal" as="section">
        <div className="br-request-modal__header">
          <div>
            <h1>Оставить заявку</h1>
            <p>Заполните короткую форму, чтобы отправить заявку на конкретный номер.</p>
          </div>
          <Link href={`/a/${pageData.agent.publicId}`} className="br-request-modal__close" aria-label="Закрыть">
            x
          </Link>
        </div>

        {pageData.publicWarningText ? <p className="br-inline-notice">{pageData.publicWarningText}</p> : null}

        <GuestRequestForm
          propertySlug={selectedSection?.property.slug}
          rooms={activeRooms}
          defaultRoomId={defaultRoomId}
          filters={pageData.filters}
          action={submitAgentGuestRequestAction}
          hiddenFields={[{ name: "agentPublicId", value: pageData.agent.publicId }]}
          contextMessage={getPublicRequestContextMessage("agent")}
          errorMessage={error ? getPublicRequestErrorText("agent", error) : undefined}
          propertyTitle={selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
        />
      </Panel>
    </main>
  );
}
