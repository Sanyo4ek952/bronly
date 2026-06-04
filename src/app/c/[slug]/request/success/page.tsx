import { CircleCheckBig } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type CollectionRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function CollectionRequestSuccessPage({ params, searchParams }: CollectionRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicCollectionPageData(slug);

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

  const selectedSection = pageData.sections.find((section) => section.property.slug === propertySlug) ?? pageData.sections[0];
  const selectedRoom = selectedSection?.rooms.find((room) => room.id === roomId) ?? null;
  const roomSummary = selectedSection && selectedRoom ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}` : "выбранный номер";
  const isAgentCollection = pageData.collection.creatorRole === "agent";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          Заявка на {roomSummary} отправлена.
          {isAgentCollection
            ? ` ${pageData.contact.displayName} получил ваш запрос на проживание и при необходимости передаст его владельцу, чтобы уточнить доступность.`
            : " Владелец получил ваш запрос на проживание и свяжется с вами, чтобы уточнить доступность."}
          {pageData.contact.phone ? ` Рекомендуем сохранить номер ${pageData.contact.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/c/${pageData.collection.slug}`} fullWidth>
            Вернуться к коллекции
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            На главную
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
