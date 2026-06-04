import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicPropertyPageData } from "@/entities/property";
import { GuestRequestForm } from "@/features/request/submit-request";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitGuestRequestAction } from "./actions";

type PublicRequestPageProps = {
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
      return "Выбранный номер больше недоступен. Проверьте номер и попробуйте снова.";
    case "availability":
      return "На выбранные даты у номера есть занятые даты. Выберите другой период или номер.";
    case "property":
      return "Объект больше недоступен по этой ссылке.";
    case "subscription":
      return "Владелец еще не продлил доступ к сервису. Новые заявки по этой ссылке сейчас не принимаются.";
    case "validation":
      return "Проверьте имя, телефон, номер и даты проживания.";
    default:
      return "Не удалось отправить заявку. Проверьте поля и попробуйте еще раз.";
  }
}

export default async function PublicRequestPage({ params, searchParams }: PublicRequestPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertyData = await getPublicPropertyPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

  if (!propertyData) {
    notFound();
  }

  if (propertyData.publicUnavailableReason || !propertyData.property) {
    const unavailable = getPublicUnavailableContent("ownerRequest", propertyData.publicUnavailableReason);

    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>{unavailable.title}</h1>
          <p>{unavailable.description}</p>
          <div className="br-request-success__actions">
            <ButtonLink href="/" fullWidth>
              На главную
            </ButtonLink>
            {unavailable.showLogin ? (
              <ButtonLink href="/login" variant="secondary" fullWidth>
                Войти в кабинет
              </ButtonLink>
            ) : null}
          </div>
        </Panel>
      </main>
    );
  }

  const { property, rooms, filters, publicWarningText } = propertyData;
  const error = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const activeRooms = rooms.filter((room) => room.status === "active");
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
            <p>Владелец свяжется с вами и уточнит доступность.</p>
          </div>
          <Link href={`/p/${property.slug}`} className="br-request-modal__close" aria-label="Закрыть">
            x
          </Link>
        </div>

        {error ? (
          <p className="br-card" style={{ marginBottom: 16, padding: 16 }}>
            {getErrorText(error)}
          </p>
        ) : null}

        {publicWarningText ? <p className="br-inline-notice">{publicWarningText}</p> : null}

        <GuestRequestForm
          propertySlug={property.slug}
          rooms={rooms}
          defaultRoomId={defaultRoomId}
          filters={filters}
          action={submitGuestRequestAction}
        />
      </Panel>
    </main>
  );
}
