import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
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

type PublicRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Заявка отправлена",
  description: "Служебная страница успешной отправки заявки в Bronly.",
  path: "/p/request/success",
  index: false,
});

export default async function PublicRequestSuccessPage({ params, searchParams }: PublicRequestSuccessPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug.shouldRedirect) {
    const redirectQuery = buildSearchParams(query);
    redirect(
      `/p/${encodePublicPathSegment(resolvedSlug.ownerSlug)}/request/success${redirectQuery.size ? `?${redirectQuery.toString()}` : ""}`,
    );
  }

  const filters = {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  };
  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug, filters);

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
  const roomId = getSearchString(query, "roomId");
  const selectedSection = propertySlug ? pageData.properties.find((section) => section.property.slug === propertySlug) ?? null : null;
  const selectedRoom =
    selectedSection?.rooms.find((room) => room.id === roomId) ?? pageData.standaloneRooms.find((room) => room.id === roomId) ?? null;
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, pageData.filters, selectedSection?.property.shortTitle) : null;
  const steps = getPublicRequestSuccessSteps("owner", pageData.owner.phone);
  const introText = summary
    ? `Заявка на номер «${summary.roomTitle}» отправлена. Владелец свяжется с вами, чтобы уточнить доступность.`
    : "Заявка отправлена. Владелец свяжется с вами, чтобы уточнить доступность.";

  return (
    <PublicRequestSuccessScreen
      introText={introText}
      summary={summary}
      steps={steps}
      returnHref={`/p/${pageData.owner.slug}`}
      returnLabel="Вернуться к странице"
      secondaryAction={
        <ButtonLink href="/" variant="secondary" fullWidth>
          На главную
        </ButtonLink>
      }
    />
  );
}
