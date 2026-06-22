import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnerPropertySectionBySlug, getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
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

import { submitGuestRequestAction } from "./actions";

type PublicRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка на проживание",
  description: "Форма отправки заявки на проживание в Bronly.",
  path: "/p/request",
  index: false,
});

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function buildOwnerRequestRedirectHref(
  ownerSlug: string,
  query: Record<string, string | string[] | undefined>,
  matchedPropertySlug: string | null,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  if (matchedPropertySlug && !params.get("propertySlug")) {
    params.set("propertySlug", matchedPropertySlug);
  }

  const search = params.toString();
  return `/p/${encodePublicPathSegment(ownerSlug)}/request${search ? `?${search}` : ""}`;
}

export default async function PublicRequestPage({ params, searchParams }: PublicRequestPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug.shouldRedirect) {
    redirect(buildOwnerRequestRedirectHref(resolvedSlug.ownerSlug, query, resolvedSlug.matchedPropertySlug));
  }

  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

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

  const propertySlug = getSearchString(query, "propertySlug");
  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection = propertySlug ? getOwnerPropertySectionBySlug(pageData, propertySlug) : null;
  const scopedRooms = selectedSection
    ? selectedSection.rooms
    : pageData.standaloneRooms.length
      ? pageData.standaloneRooms
      : pageData.properties[0]?.rooms ?? [];
  const activeRooms = scopedRooms.filter((room) => room.status === "active");
  const hasRequestedRoom = Boolean(requestedRoomId);
  const requestedRoomIsValid = hasRequestedRoom ? activeRooms.some((room) => room.id === requestedRoomId) : true;
  const defaultRoomId =
    (requestedRoomIsValid ? activeRooms.find((room) => room.id === requestedRoomId)?.id : undefined) ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";
  const error = requestedError || (!requestedRoomIsValid ? "room" : "");
  const selectedRoom = findRequestRoom(scopedRooms, defaultRoomId);

  if (!activeRooms.length) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Заявка временно недоступна</h1>
          <p>По выбранному варианту сейчас нет активных номеров для запроса на проживание.</p>
          <div className="br-request-success__actions">
            <ButtonLink href={`/p/${pageData.owner.slug}`} fullWidth>
              Вернуться на страницу владельца
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
          <Link href={`/p/${pageData.owner.slug}`} className="br-request-modal__close" aria-label="Закрыть">
            x
          </Link>
        </div>

        {pageData.publicWarningText ? <p className="br-inline-notice">{pageData.publicWarningText}</p> : null}

        <GuestRequestForm
          publicSlug={pageData.owner.slug}
          propertySlug={selectedSection?.property.slug}
          rooms={scopedRooms}
          defaultRoomId={defaultRoomId}
          filters={pageData.filters}
          action={submitGuestRequestAction}
          contextMessage={getPublicRequestContextMessage("owner")}
          errorMessage={error ? getPublicRequestErrorText("owner", error) : undefined}
          propertyTitle={selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
        />
      </Panel>
    </main>
  );
}
