import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import {
  buildPublicRequestSummary,
  getPublicRequestSuccessSteps,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { encodePublicPathSegment } from "@/shared/lib/public-links";
import { buildSearchParams, createSeoMetadata, getSearchString, readSearchParams } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui";
import { PublicUnavailableState } from "@/widgets/public-page";
import { PublicRequestSuccessScreen } from "@/widgets/public-request";

type AgentRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки по ссылке агента в Bronly.",
  path: "/a/request/success",
  index: false,
});

export default async function AgentRequestSuccessPage({ params, searchParams }: AgentRequestSuccessPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
  const filters = {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  };
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicAgentPageData(slug, filters);

  if (!pageData) {
    notFound();
  }

  if (pageData.shouldRedirectToCanonical && pageData.agent?.publicId) {
    const redirectQuery = buildSearchParams(query);
    const suffix = redirectQuery.toString();
    redirect(`/a/${encodePublicPathSegment(pageData.agent.publicId)}/request/success${suffix ? `?${suffix}` : ""}`);
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} inAuthLayout />;
  }

  const selectedSection = propertySlug
    ? pageData.properties.find((property) => property.property.slug === propertySlug) ?? null
    : null;
  const selectedRoom =
    pageData.standaloneRooms.find((room) => room.id === roomId) ??
    selectedSection?.rooms.find((room) => room.id === roomId) ??
    null;
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const steps = getPublicRequestSuccessSteps("agent", pageData.agent.phone);
  const introText = summary
    ? `Заявка на номер «${summary.roomTitle}» отправлена. Агент получит её и свяжется с вами, чтобы уточнить детали.`
    : "Заявка отправлена. Агент получит её и свяжется с вами, чтобы уточнить детали.";

  return (
    <PublicRequestSuccessScreen
      introText={introText}
      summary={summary}
      steps={steps}
      returnHref={`/a/${pageData.agent.publicId}`}
      returnLabel="Вернуться к витрине"
      secondaryAction={
        <ButtonLink href="/" variant="secondary" fullWidth>
          На главную
        </ButtonLink>
      }
    />
  );
}
