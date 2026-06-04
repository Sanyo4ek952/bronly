import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

type CollectionRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionRequestSuccessPage({ params }: CollectionRequestSuccessPageProps) {
  const { slug } = await params;
  const pageData = await getPublicCollectionPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.collection) {
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

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon">✓</div>
        <h1>Заявка отправлена</h1>
        <p>Заявка отправлена. Владелец свяжется с вами для уточнения доступности.</p>
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
