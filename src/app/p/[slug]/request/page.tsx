import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOwnerPropertySectionBySlug, getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { GuestRequestForm } from "@/features/request/submit-request";
import {
  getPublicRequestContextMessage,
  getPublicRequestErrorText,
  resolveRequestRoomSelection,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { encodePublicPathSegment } from "@/shared/lib/public-links";
import { buildSearchParams, createSeoMetadata, getSearchString, readSearchParams } from "@/shared/lib";
import { PublicUnavailableState } from "@/widgets/public-page";
import { PublicRequestPageFrame } from "@/widgets/public-request";

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

function buildOwnerRequestRedirectHref(
  ownerSlug: string,
  query: Record<string, string | string[] | undefined>,
  matchedPropertySlug: string | null,
) {
  const params = buildSearchParams(query);

  if (matchedPropertySlug && !params.get("propertySlug")) {
    params.set("propertySlug", matchedPropertySlug);
  }

  const search = params.toString();
  return `/p/${encodePublicPathSegment(ownerSlug)}/request${search ? `?${search}` : ""}`;
}

export default async function PublicRequestPage({ params, searchParams }: PublicRequestPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
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
      <PublicUnavailableState
        title={unavailable.title}
        description={unavailable.description}
        showLogin={unavailable.showLogin}
        inAuthLayout
      />
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
  const selection = resolveRequestRoomSelection(scopedRooms, requestedRoomId, requestedError);

  if (!selection.activeRooms.length) {
    return (
      <PublicUnavailableState
        title="Заявка временно недоступна"
        description="По выбранному варианту сейчас нет активных номеров для запроса на проживание."
        homeHref={`/p/${pageData.owner.slug}`}
        homeLabel="Вернуться на страницу владельца"
        inAuthLayout
      />
    );
  }

  return (
    <PublicRequestPageFrame
      title="Оставить заявку"
      description="Заполните короткую форму, чтобы отправить заявку на конкретный номер."
      closeHref={`/p/${pageData.owner.slug}`}
      warningText={pageData.publicWarningText}
    >
      <GuestRequestForm
        publicSlug={pageData.owner.slug}
        propertySlug={selectedSection?.property.slug}
        rooms={scopedRooms}
        defaultRoomId={selection.defaultRoomId}
        filters={pageData.filters}
        action={submitGuestRequestAction}
        contextMessage={getPublicRequestContextMessage("owner")}
        errorMessage={selection.error ? getPublicRequestErrorText("owner", selection.error) : undefined}
        propertyTitle={selection.selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
      />
    </PublicRequestPageFrame>
  );
}
