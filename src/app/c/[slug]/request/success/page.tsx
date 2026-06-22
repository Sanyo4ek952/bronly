import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import {
  buildPublicRequestSummary,
  getPublicRequestSuccessSteps,
} from "@/features/request/submit-request/model/public-request-ui";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { createSeoMetadata, getSearchString, readSearchParams } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui";
import { PublicUnavailableState } from "@/widgets/public-page";
import { PublicRequestSuccessScreen } from "@/widgets/public-request";

type CollectionRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки из коллекции в Bronly.",
  path: "/c/request/success",
  index: false,
});

export default async function CollectionRequestSuccessPage({ params, searchParams }: CollectionRequestSuccessPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
  const filters = {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  };
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicCollectionPageData(slug, filters);

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.collection || !pageData.contact) {
    const unavailable = getPublicUnavailableContent("collection", pageData.publicUnavailableReason);

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} inAuthLayout />;
  }

  const selectedSection = propertySlug ? pageData.sections.find((section) => section.property.slug === propertySlug) ?? null : null;
  const selectedRoom =
    pageData.standaloneRooms.find((item) => item.room.id === roomId)?.room ??
    selectedSection?.rooms.find((room) => room.id === roomId) ??
    null;
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const contextKind = pageData.collection.creatorRole === "agent" ? "collection-agent" : "collection-owner";
  const steps = getPublicRequestSuccessSteps(contextKind, pageData.contact.phone);
  const introText = summary
    ? `Заявка на номер «${summary.roomTitle}» из подборки отправлена. ${
        contextKind === "collection-agent"
          ? "Агент получит её и при необходимости передаст владельцу для уточнения доступности."
          : "Владелец свяжется с вами, чтобы уточнить доступность."
      }`
    : "Заявка отправлена. С вами свяжутся, чтобы уточнить доступность.";

  return (
    <PublicRequestSuccessScreen
      introText={introText}
      summary={summary}
      steps={steps}
      returnHref={`/c/${pageData.collection.slug}`}
      returnLabel="Вернуться к подборке"
      secondaryAction={
        <ButtonLink href="/" variant="secondary" fullWidth>
          На главную
        </ButtonLink>
      }
    />
  );
}
