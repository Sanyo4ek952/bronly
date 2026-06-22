import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { GuestRequestForm } from "@/features/request/submit-request";
import {
  getPublicRequestContextMessage,
  getPublicRequestErrorText,
  resolveRequestRoomSelection,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { createSeoMetadata, getSearchString, readSearchParams } from "@/shared/lib";
import { PublicUnavailableState } from "@/widgets/public-page";
import { PublicRequestPageFrame } from "@/widgets/public-request";

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

export default async function PublicCollectionRequestPage({ params, searchParams }: PublicCollectionRequestPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
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

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} inAuthLayout />;
  }

  const propertySlug = getSearchString(query, "propertySlug");
  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection = propertySlug ? pageData.sections.find((section) => section.property.slug === propertySlug) ?? null : null;
  const scopedRooms = propertySlug ? selectedSection?.rooms ?? [] : pageData.standaloneRooms.map((item) => item.room);
  const selection = resolveRequestRoomSelection(scopedRooms, requestedRoomId, requestedError);
  const contextKind = pageData.collection.creatorRole === "agent" ? "collection-agent" : "collection-owner";

  if (!selection.activeRooms.length) {
    return (
      <PublicUnavailableState
        title="Заявка временно недоступна"
        description="По этой подборке сейчас нет активных номеров для запроса на проживание."
        homeHref={`/c/${pageData.collection.slug}`}
        homeLabel="Вернуться к подборке"
        inAuthLayout
      />
    );
  }

  return (
    <PublicRequestPageFrame
      title="Оставить заявку по номеру из подборки"
      description="Заполните короткую форму, чтобы отправить заявку по выбранному конкретному номеру из этой подборки."
      closeHref={`/c/${pageData.collection.slug}`}
      warningText={pageData.publicWarningText}
      notice={<p className="br-inline-notice br-inline-notice--soft">Подборка помогает выбрать вариант, но заявка всегда отправляется только по конкретному номеру.</p>}
    >
      <GuestRequestForm
        propertySlug={selectedSection?.property.slug}
        rooms={selection.activeRooms}
        defaultRoomId={selection.defaultRoomId}
        filters={pageData.filters}
        action={submitCollectionGuestRequestAction}
        hiddenFields={[{ name: "collectionSlug", value: pageData.collection.slug }]}
        contextMessage={getPublicRequestContextMessage(contextKind)}
        errorMessage={selection.error ? getPublicRequestErrorText("collection", selection.error) : undefined}
        propertyTitle={selection.selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
        roomFieldHint="Выберите конкретный номер из подборки. Заявка будет отправлена только по нему."
        headingEyebrow="Номер из подборки"
      />
    </PublicRequestPageFrame>
  );
}
