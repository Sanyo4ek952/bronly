import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { Button, ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicPropertyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function buildOwnerRedirectHref(
  ownerSlug: string,
  query: Record<string, string | string[] | undefined>,
  matchedPropertySlug: string | null,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  if (matchedPropertySlug && !params.get("propertySlug")) {
    params.set("propertySlug", matchedPropertySlug);
  }

  const search = params.toString();
  return `/p/${ownerSlug}${search ? `?${search}` : ""}`;
}

export default async function PublicPropertyPage({ params, searchParams }: PublicPropertyPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug.shouldRedirect) {
    redirect(buildOwnerRedirectHref(resolvedSlug.ownerSlug, query, resolvedSlug.matchedPropertySlug));
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
    const unavailable = getPublicUnavailableContent("ownerPage", pageData.publicUnavailableReason);

    return (
      <main className="br-page">
        <div className="br-container">
          <section className="br-request-success br-card" style={{ margin: "48px auto" }}>
            <h1>{unavailable.title}</h1>
            <p>{unavailable.description}</p>
            <div className="br-request-success__actions">
              {unavailable.showLogin ? <ButtonLink href="/login" fullWidth>Войти в кабинет</ButtonLink> : null}
              <ButtonLink href="/" variant="secondary" fullWidth>На главную</ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { owner, properties, standaloneRooms, filters, publicWarningText } = pageData;
  const heroPhoto = properties[0]?.property.photos[0] ?? standaloneRooms[0]?.photos[0];
  const firstSectionWithRooms = properties.find((section) => section.rooms.length > 0);
  const firstRequestHref = firstSectionWithRooms
    ? `/p/${owner.slug}/request?propertySlug=${encodeURIComponent(firstSectionWithRooms.property.slug)}`
    : standaloneRooms[0]
      ? `/p/${owner.slug}/request?roomId=${encodeURIComponent(standaloneRooms[0].id)}`
      : null;

  return (
    <main className="br-page">
      <div className="br-container">
        <header className="br-header br-header--public">
          <BrandSlot />
          <nav className="br-nav" aria-label="Навигация публичной страницы владельца">
            <a href="#owner-rooms">Номера и цены</a>
            <a href="#owner-contact">Контакты</a>
          </nav>
          {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку</ButtonLink> : null}
        </header>

        <section className="br-public-hero br-card">
          <div className="br-public-hero__media">
            {heroPhoto ? (
              <Image src={heroPhoto.url} alt={owner.displayName} width={1600} height={1000} unoptimized className="br-public-hero__image" />
            ) : null}
          </div>
          <div className="br-public-hero__body">
            <div>
              <h1>{owner.displayName}</h1>
              <p>Персональная страница владельца Bronly. Выберите объект или отдельный номер и оставьте запрос на проживание.</p>
            </div>
            <div id="owner-contact" className="br-public-hero__actions">
              {owner.phone ? <Button variant="secondary">{owner.phone}</Button> : null}
              {owner.whatsapp ? <Button variant="secondary">Написать в WhatsApp</Button> : null}
              {owner.telegram ? <Button variant="secondary">{owner.telegram}</Button> : null}
              {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку</ButtonLink> : null}
            </div>
          </div>
        </section>

        {publicWarningText ? <div className="br-inline-notice" style={{ marginTop: 18 }}>{publicWarningText}</div> : null}

        <section id="owner-rooms" className="br-section br-section--public">
          <div className="br-section-heading">
            <h2>Номера и цены</h2>
            <p>Гость видит только контент этого владельца по конкретной ссылке. Заявка всегда создается на конкретный номер.</p>
          </div>

          {properties.length ? (
            <div className="br-owner-stack">
              {properties.map((section) => (
                <article key={section.property.id} className="br-card br-collection-public-section">
                  <div className="br-dashboard-block__header">
                    <div>
                      <h3>{section.property.shortTitle}</h3>
                      <p>{section.property.city}, {section.property.address}</p>
                    </div>
                  </div>

                  {section.rooms.length ? (
                    <PublicRoomBrowser publicBaseHref={`/p/${owner.slug}`} propertySlug={section.property.slug} rooms={section.rooms} filters={filters} showFilter={false} />
                  ) : (
                    <div className="br-card" style={{ marginTop: 16, padding: 16 }}>
                      По этому объекту пока нет активных номеров для заявки.
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : null}

          {standaloneRooms.length ? (
            <article className="br-card br-collection-public-section" style={{ marginTop: properties.length ? 16 : 0 }}>
              <div className="br-dashboard-block__header">
                <div>
                  <h3>Отдельные номера</h3>
                  <p>Самостоятельные номера без объекта, доступные по этой ссылке владельца.</p>
                </div>
              </div>
              <PublicRoomBrowser publicBaseHref={`/p/${owner.slug}`} propertySlug="" rooms={standaloneRooms} filters={filters} showFilter={false} />
            </article>
          ) : null}

          {!properties.length && !standaloneRooms.length ? (
            <section className="br-dashboard-block br-card">
              <div className="br-dashboard-block__header">
                <div>
                  <h3>Пока нет доступных вариантов</h3>
                  <p>Владелец ещё не опубликовал объекты или отдельные номера для этой ссылки.</p>
                </div>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function BrandSlot() {
  return (
    <Link href="/" className="br-logo">
      <span className="br-logo__mark" aria-hidden="true">b</span>
      <span className="br-logo__wordmark">
        Bron<span className="br-logo__accent">ly</span>
      </span>
    </Link>
  );
}
