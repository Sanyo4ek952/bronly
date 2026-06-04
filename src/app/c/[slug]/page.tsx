import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData, recordPublicCollectionOpen } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicCollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function buildCollectionRequestHref(
  collectionSlug: string,
  propertySlug: string,
  roomId: string,
  query: URLSearchParams,
) {
  query.set("propertySlug", propertySlug);
  query.set("roomId", roomId);

  return `/c/${collectionSlug}/request?${query.toString()}`;
}

export default async function PublicCollectionPage({ params, searchParams }: PublicCollectionPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const pageData = await getPublicCollectionPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

  if (!pageData) {
    notFound();
  }

  if (pageData.publicUnavailableReason || !pageData.collection || !pageData.contact) {
    const unavailable = getPublicUnavailableContent("collection", pageData.publicUnavailableReason);

    return (
      <main className="br-page">
        <div className="br-container">
          <section className="br-request-success br-card" style={{ margin: "48px auto" }}>
            <h1>{unavailable.title}</h1>
            <p>{unavailable.description}</p>
            <div className="br-request-success__actions">
              <ButtonLink href="/" fullWidth>
                На главную
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  await recordPublicCollectionOpen(slug);

  const { collection, contact, sections, filters, publicWarningText } = pageData;
  const heroPhoto = sections[0]?.property.photos[0];

  return (
    <main className="br-page">
      <div className="br-container">
        <header className="br-header br-header--public">
          <BrandSlot />
          <nav className="br-nav" aria-label="Навигация коллекции">
            <a href="#collection-rooms">Номера и цены</a>
            <a href="#collection-contact">Контакт</a>
          </nav>
          <ButtonLink
            href={
              sections[0]
                ? `/c/${collection.slug}/request?propertySlug=${encodeURIComponent(sections[0].property.slug)}`
                : `/c/${collection.slug}`
            }
          >
            Оставить заявку
          </ButtonLink>
        </header>

        <section className="br-public-hero br-card">
          <div className="br-public-hero__media">
            {heroPhoto ? (
              <Image
                src={heroPhoto.url}
                alt={collection.title}
                width={1600}
                height={1000}
                unoptimized
                className="br-public-hero__image"
              />
            ) : null}
          </div>
          <div className="br-public-hero__body">
            <div>
              <h1>{collection.title}</h1>
              <p>{collection.guestLabel || "Подборка объектов и номеров по конкретной ссылке."}</p>
              <p className="br-collection-public-copy">
                Выберите конкретный номер и отправьте заявку. Bronly не подтверждает проживание от имени сервиса.
              </p>
            </div>
            <div id="collection-contact" className="br-public-hero__actions">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="br-button br-button--secondary">
                  {contact.phone}
                </a>
              ) : null}
              {contact.whatsapp ? (
                <a href={contact.whatsapp} className="br-button br-button--secondary">
                  WhatsApp
                </a>
              ) : null}
              {contact.telegram ? (
                <a
                  href={contact.telegram.startsWith("http") ? contact.telegram : `https://t.me/${contact.telegram.replace(/^@/, "")}`}
                  className="br-button br-button--secondary"
                >
                  Telegram
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {publicWarningText ? (
          <div className="br-inline-notice" style={{ marginTop: 18 }}>
            {publicWarningText}
          </div>
        ) : null}

        <section id="collection-rooms" className="br-section br-section--public">
          <div className="br-section-heading">
            <h2>Номера и цены</h2>
            <p>
              Коллекция показывает только добавленные объекты и номера. Заявка всегда отправляется на конкретный номер.
            </p>
          </div>

          <form className="br-public-filter br-card" method="get">
            <label className="br-form-field">
              <span className="br-label">Заезд</span>
              <input id="collection-check-in" name="checkIn" type="date" className="br-field" defaultValue={filters.checkIn} />
            </label>
            <label className="br-form-field">
              <span className="br-label">Выезд</span>
              <input id="collection-check-out" name="checkOut" type="date" className="br-field" defaultValue={filters.checkOut} />
            </label>
            <label className="br-form-field">
              <span className="br-label">Гости</span>
              <select id="collection-adults" name="adults" className="br-field" defaultValue={String(filters.adults)}>
                {Array.from({ length: 8 }, (_, index) => {
                  const value = String(index + 1);
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="br-form-field">
              <span className="br-label">Спальни</span>
              <select id="collection-rooms-filter" name="rooms" className="br-field" defaultValue={String(filters.rooms)}>
                {Array.from({ length: 5 }, (_, index) => {
                  const value = String(index + 1);
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="br-public-filter__actions">
              <button type="submit" className="br-button br-button--primary br-button--full">
                Уточнить доступность
              </button>
              <Link href={`/c/${collection.slug}`} className="br-button br-button--secondary br-button--full">
                Сбросить
              </Link>
            </div>
          </form>

          {filters.hasDates ? (
            <div className="br-inline-notice" style={{ marginTop: 18 }}>
              Показана доступность с {filters.checkIn} по {filters.checkOut}. Итоговая сумма считается по ночам.
            </div>
          ) : null}

          {sections.length ? (
            <div className="br-owner-stack" style={{ marginTop: 24 }}>
              {sections.map((section) => (
                <article key={section.property.id} className="br-card br-collection-public-section">
                  <div className="br-dashboard-block__header">
                    <div>
                      <h3>{section.property.shortTitle}</h3>
                      <p>
                        {section.property.city}, {section.property.address}
                      </p>
                    </div>
                    <span className="br-collection-public-badge">
                      {section.sourceKinds.includes("property") ? "Объект в коллекции" : "Номер в коллекции"}
                    </span>
                  </div>

                  <PublicRoomBrowser
                    propertySlug={section.property.slug}
                    rooms={section.rooms}
                    filters={filters}
                    resetHref={`/c/${collection.slug}`}
                    showFilter={false}
                    requestHrefBuilder={(roomId, currentFilters) => {
                      const requestQuery = new URLSearchParams();

                      if (currentFilters.hasDates) {
                        requestQuery.set("checkIn", currentFilters.checkIn);
                        requestQuery.set("checkOut", currentFilters.checkOut);
                      }

                      requestQuery.set("adults", String(currentFilters.adults));
                      requestQuery.set("rooms", String(currentFilters.rooms));

                      return buildCollectionRequestHref(collection.slug, section.property.slug, roomId, requestQuery);
                    }}
                  />
                </article>
              ))}
            </div>
          ) : (
            <section className="br-dashboard-block br-card" style={{ marginTop: 24 }}>
              <div className="br-dashboard-block__header">
                <div>
                  <h3>В этой коллекции пока нет доступных номеров</h3>
                  <p>Попробуйте открыть ссылку позже или уточните даты.</p>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function BrandSlot() {
  return (
    <Link href="/" className="br-logo">
      <span className="br-logo__mark" aria-hidden="true">
        b
      </span>
      <span className="br-logo__wordmark">
        Bron<span className="br-logo__accent">ly</span>
      </span>
    </Link>
  );
}
