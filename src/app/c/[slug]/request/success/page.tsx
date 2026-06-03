import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
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

  if (pageData.publicUnavailableReason === "subscription_expired" || !pageData.collection) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Страница временно недоступна</h1>
          <p>Новые заявки по этой ссылке сейчас не принимаются.</p>
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
        <div className="br-request-success__icon">вњ“</div>
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
