import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
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

export default async function AgentRequestPage({ params, searchParams }: AgentRequestPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
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
    const redirectQuery = buildSearchParams(query);
    const suffix = redirectQuery.toString();
    redirect(`/a/${encodePublicPathSegment(pageData.agent.publicId)}/request${suffix ? `?${suffix}` : ""}`);
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} inAuthLayout />;
  }

  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const selectedSection =
    pageData.properties.find((property) => property.property.slug === propertySlug) ??
    (propertySlug ? null : pageData.properties[0] ?? null);
  const scopedRooms = propertySlug
    ? selectedSection?.rooms ?? []
    : pageData.standaloneRooms;
  const selection = resolveRequestRoomSelection(scopedRooms, requestedRoomId, requestedError);

  if (!selection.activeRooms.length) {
    return (
      <PublicUnavailableState
        title="Сейчас нет доступных номеров"
        description="По этой витрине сейчас нельзя оставить заявку. Вернитесь и выберите другой вариант."
        homeHref={`/a/${pageData.agent.publicId}`}
        homeLabel="Вернуться к витрине"
        inAuthLayout
      />
    );
  }

  return (
    <PublicRequestPageFrame
      title="Оставить заявку"
      description="Заполните короткую форму, чтобы отправить заявку на конкретный номер."
      closeHref={`/a/${pageData.agent.publicId}`}
      warningText={pageData.publicWarningText}
    >
      <GuestRequestForm
        propertySlug={selectedSection?.property.slug}
        rooms={selection.activeRooms}
        defaultRoomId={selection.defaultRoomId}
        filters={pageData.filters}
        action={submitAgentGuestRequestAction}
        hiddenFields={[{ name: "agentPublicId", value: pageData.agent.publicId }]}
        contextMessage={getPublicRequestContextMessage("agent")}
        errorMessage={selection.error ? getPublicRequestErrorText("agent", selection.error) : undefined}
        propertyTitle={selection.selectedRoom?.propertyTitle ?? selectedSection?.property.shortTitle}
      />
    </PublicRequestPageFrame>
  );
}
