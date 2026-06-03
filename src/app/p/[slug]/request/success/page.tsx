import { notFound } from "next/navigation";

import { getPublicPropertyPageData } from "@/entities/property";
import { ButtonLink, Panel } from "@/shared/ui";

type PublicRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicRequestSuccessPage({ params }: PublicRequestSuccessPageProps) {
  const { slug } = await params;
  const propertyData = await getPublicPropertyPageData(slug);

  if (!propertyData) {
    notFound();
  }

  if (propertyData.publicUnavailableReason === "subscription_expired" || !propertyData.property) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Страница временно недоступна</h1>
          <p>Доступ к сервису еще не продлен. Новые заявки по этой ссылке сейчас не принимаются.</p>
          <div className="br-request-success__actions">
            <ButtonLink href="/login" fullWidth>
              Войти в кабинет
            </ButtonLink>
            <ButtonLink href="/" variant="secondary" fullWidth>
              На главную
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const { property } = propertyData;

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon">✓</div>
        <h1>Заявка отправлена</h1>
        <p>
          Владелец получил ваш запрос на проживание и свяжется с вами, чтобы уточнить доступность.
          {property.phone ? ` Рекомендуем сохранить номер ${property.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href="/" fullWidth>
            Перейти на главную
          </ButtonLink>
          <ButtonLink href={`/p/${property.slug}`} variant="secondary" fullWidth>
            Посмотреть объект
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
