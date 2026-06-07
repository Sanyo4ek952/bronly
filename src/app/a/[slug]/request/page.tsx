import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { GuestRequestForm } from "@/features/request/submit-request";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitAgentGuestRequestAction } from "./actions";

type AgentRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function getErrorText(error: string) {
  switch (error) {
    case "room":
      return "Выбранный номер больше не доступен. Проверьте номер и попробуйте снова.";
    case "availability":
      return "На выбранные даты у номера есть занятые даты. Выберите другой период или номер.";
    case "property":
      return "Объект больше не доступен по этой ссылке.";
    case "subscription":
      return "Доступ к агентской витрине временно ограничен. Новые заявки сейчас не принимаются.";
    case "validation":
      return "Проверьте имя, телефон, номер и даты проживания.";
    default:
      return "Не удалось отправить заявку. Проверьте поля и попробуйте еще раз.";
  }
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
      if (typeof value === "string") {
        redirectQuery.set(key, value);
      }
    }

    const suffix = redirectQuery.toString();
    redirect(`/a/${pageData.agent.publicId}/request${suffix ? `?${suffix}` : ""}`);
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

  const selectedSection =
    pageData.properties.find((property) => property.property.slug === propertySlug) ?? pageData.properties[0];

  if (!selectedSection) {
    notFound();
  }

  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const activeRooms = selectedSection.rooms.filter((room) => room.status === "active");
  const hasRequestedRoom = Boolean(requestedRoomId);
  const requestedRoomIsValid = hasRequestedRoom ? activeRooms.some((room) => room.id === requestedRoomId) : true;
  const defaultRoomId =
    (requestedRoomIsValid ? activeRooms.find((room) => room.id === requestedRoomId)?.id : undefined) ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";
  const error = requestedError || (!requestedRoomIsValid ? "room" : "");

  if (!activeRooms.length) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Сейчас нет доступных номеров</h1>
          <p>По этому объекту сейчас нельзя оставить заявку. Вернитесь в агентскую витрину и выберите другой вариант.</p>
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
            <p>Агент получит ваш запрос и вручную передаст его владельцу для уточнения доступности.</p>
          </div>
          <Link href={`/a/${pageData.agent.publicId}`} className="br-request-modal__close" aria-label="Закрыть">
            x
          </Link>
        </div>

        {error ? (
          <p className="br-card" style={{ marginBottom: 16, padding: 16 }}>
            {getErrorText(error)}
          </p>
        ) : null}

        {pageData.publicWarningText ? <p className="br-inline-notice">{pageData.publicWarningText}</p> : null}

        <GuestRequestForm
          propertySlug={selectedSection.property.slug}
          rooms={selectedSection.rooms}
          defaultRoomId={defaultRoomId}
          filters={pageData.filters}
          action={submitAgentGuestRequestAction}
          hiddenFields={[{ name: "agentPublicId", value: pageData.agent.publicId }]}
        />
      </Panel>
    </main>
  );
}
