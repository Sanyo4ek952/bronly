import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { GuestRequestForm } from "@/features/request/submit-request";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitCollectionGuestRequestAction } from "./actions";

type PublicCollectionRequestPageProps = {
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
      return "Выбранный номер больше недоступен в этой коллекции. Проверьте выбор и попробуйте снова.";
    case "availability":
      return "На выбранные даты у номера есть занятые даты. Выберите другой период или номер.";
    case "property":
      return "Объект больше недоступен в этой коллекции.";
    case "subscription":
      return "Новые заявки по этой ссылке сейчас не принимаются.";
    case "validation":
      return "Проверьте имя, телефон, номер и даты проживания.";
    default:
      return "Не удалось отправить заявку. Попробуйте еще раз.";
  }
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
  const error = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection =
    pageData.sections.find((section) => section.property.slug === propertySlug) ?? pageData.sections[0];

  if (!selectedSection) {
    notFound();
  }

  const activeRooms = selectedSection.rooms.filter((room) => room.status === "active");
  const defaultRoomId =
    activeRooms.find((room) => room.id === requestedRoomId)?.id ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-modal" as="section">
        <div className="br-request-modal__header">
          <div>
            <h1>Оставить заявку</h1>
            <p>Заявка будет отправлена на конкретный номер и владелец свяжется с вами для уточнения доступности.</p>
          </div>
          <Link href={`/c/${pageData.collection.slug}`} className="br-request-modal__close" aria-label="Закрыть">
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
          action={submitCollectionGuestRequestAction}
          hiddenFields={[{ name: "collectionSlug", value: pageData.collection.slug }]}
        />
      </Panel>
    </main>
  );
}
