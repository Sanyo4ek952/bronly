import { CircleCheckBig } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type PublicRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PublicRequestSuccessPage({ params, searchParams }: PublicRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug.shouldRedirect) {
    const redirectQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        redirectQuery.set(key, value);
      }
    }

    redirect(`/p/${resolvedSlug.ownerSlug}/request/success${redirectQuery.size ? `?${redirectQuery.toString()}` : ""}`);
  }

  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug);

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
            {unavailable.showLogin ? (
              <ButtonLink href="/login" fullWidth>
                Войти в кабинет
              </ButtonLink>
            ) : null}
            <ButtonLink href="/" variant="secondary" fullWidth>
              На главную
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const selectedSection = pageData.properties.find((section) => section.property.slug === propertySlug) ?? pageData.properties[0];
  const selectedRoom = selectedSection?.rooms.find((room) => room.id === roomId) ?? null;
  const roomSummary = selectedSection && selectedRoom ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}` : "выбранный номер";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Заявка отправлена</h1>
        <p>
          Заявка на {roomSummary} отправлена. Владелец получил ваш запрос на проживание и свяжется с вами, чтобы уточнить
          доступность.
          {pageData.owner.phone ? ` Рекомендуем сохранить номер ${pageData.owner.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/p/${pageData.owner.slug}`} fullWidth>
            Вернуться к странице
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" fullWidth>
            На главную
          </ButtonLink>
        </div>
      </Panel>
    </main>
  );
}
