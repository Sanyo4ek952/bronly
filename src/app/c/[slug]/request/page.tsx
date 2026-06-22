import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { GuestRequestForm } from "@/features/request/submit-request";
import {
  findRequestRoom,
  getPublicRequestContextMessage,
  getPublicRequestErrorText,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { createSeoMetadata } from "@/shared/lib/seo";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitCollectionGuestRequestAction } from "./actions";

type PublicCollectionRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка из коллекции",
  description: "Форма отправки заявки на проживание из коллекции в Bronly.",
  path: "/c/request",
  index: false,
});

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PublicCollectionRequestPage({ params, searchParams }: PublicCollectionRequestPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const pageData = await getPublicCollectionPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

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

  const propertySlug = getSearchString(query, "propertySlug");
  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection = propertySlug
    ? pageData.sections.find((section) => section.property.slug === propertySlug) ?? null
    : null;
  const standaloneActiveRooms = pageData.standaloneRooms.map((item) => item.room).filter((room) => room.status === "active");
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
  const contextKind = pageData.collection.creatorRole === "agent" ? "collection-agent" : "collection-owner";

  if (!activeRooms.length) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Заявка временно недоступна</h1>
          <p>По этой подборке сейчас нет активных номеров для запроса на проживание.</p>
          <div className="br-request-success__actions">
            <ButtonLink href={`/c/${pageData.collection.slug}`} fullWidth>
              Вернуться к коллекции
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
          <Link href={`/c/${pageData.collection.slug}`} className="br-request-modal__close" aria-label="Закрыть">
            x
          </Link>
        </div>

        {pageData.publicWarningText ? <p className="br-inline-notice">{pageData.publicWarningText}</p> : null}

        <GuestRequestForm
          propertySlug={selectedSection?.property.slug}
          rooms={activeRooms}
          defaultRoomId={defaultRoomId}
          filters={pageData.filters}
          action={submitCollectionGuestRequestAction}
          hiddenFields={[{ name: "collectionSlug", value: pageData.collection.slug }]}
          contextMessage={getPublicRequestContextMessage(contextKind)}
          errorMessage={error ? getPublicRequestErrorText("collection", error) : undefined}
          propertyTitle={selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
        />
      </Panel>
    </main>
  );
}
