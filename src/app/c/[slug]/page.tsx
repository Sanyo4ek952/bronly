import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData, recordPublicCollectionOpen } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { createSeoMetadata, getSearchString, readSearchParams } from "@/shared/lib";
import { ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";
import { PublicBrandSlot, PublicHero, PublicPageHeader, PublicUnavailableState } from "@/widgets/public-page";

type PublicCollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatCollectionStaySummary(filters: {
  hasDates: boolean;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
}) {
  const guestsLabel = `${filters.adults} ${filters.adults === 1 ? "гость" : filters.adults < 5 ? "гостя" : "гостей"}`;
  const roomsLabel = `${filters.rooms} ${filters.rooms === 1 ? "комната" : filters.rooms < 5 ? "комнаты" : "комнат"}`;

  if (!filters.hasDates) {
    return `${guestsLabel} • ${roomsLabel}`;
  }

  return `${filters.checkIn} - ${filters.checkOut} • ${guestsLabel} • ${roomsLabel}`;
}

export async function generateMetadata({ params }: PublicCollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPublicCollectionPageData(slug);
  const title = pageData?.collection?.title ? `${pageData.collection.title} — подборка вариантов` : "Подборка вариантов проживания";

  return createSeoMetadata({
    title,
    description: "Персональная подборка объектов и номеров по прямой ссылке. Страница доступна для просмотра, но не индексируется в поиске.",
    path: `/c/${encodeURIComponent(slug)}`,
    index: false,
  });
}

export default async function PublicCollectionPage({ params, searchParams }: PublicCollectionPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
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

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} />;
  }

  await recordPublicCollectionOpen(slug);

  const { collection, contact, sections, standaloneRooms, filters, publicWarningText } = pageData;
  const heroPhoto = sections[0]?.property.photos[0];
  const staySummary = formatCollectionStaySummary(filters);
  const firstRequestHref = sections[0]
    ? `/c/${collection.slug}/request?propertySlug=${encodeURIComponent(sections[0].property.slug)}`
    : standaloneRooms[0]
      ? `/c/${collection.slug}/request?roomId=${encodeURIComponent(standaloneRooms[0].room.id)}`
      : `/c/${collection.slug}`;

  return (
    <main className="br-page">
      <div className="br-container">
        <PublicPageHeader
          actions={<ButtonLink href={firstRequestHref}>Перейти к заявке</ButtonLink>}
          navigation={
            <nav className="br-nav" aria-label="Навигация коллекции">
              <a href="#collection-rooms">Варианты</a>
              <a href="#collection-contact">Контакт</a>
            </nav>
          }
        >
          <PublicBrandSlot />
        </PublicPageHeader>

        <PublicHero
          imageUrl={heroPhoto?.url}
          imageAlt={collection.title}
          eyebrow="Персональная подборка"
          title={collection.title}
          description={collection.guestLabel || "Подборка вариантов по прямой ссылке для конкретного гостя."}
          summary={
            <>
              <p className="br-collection-public-copy">
                Эта подборка показывает только выбранные варианты. Перед отправкой заявки нужно выбрать конкретный номер.
              </p>
              <div className="br-public-collection-summary">
                <div className="br-public-collection-summary__item">
                  <span>Подборка</span>
                  <strong>{collection.title}</strong>
                </div>
                <div className="br-public-collection-summary__item">
                  <span>{filters.hasDates ? "Даты, гости и комнаты" : "Текущие параметры"}</span>
                  <strong>{staySummary}</strong>
                </div>
              </div>
              <div className="br-inline-notice br-inline-notice--soft br-public-collection-notice">
                Заявка отправляется по конкретному номеру. Даже если в подборку добавлен объект целиком, перед заявкой всё равно нужно выбрать номер.
              </div>
            </>
          }
          actions={
            <>
              <div id="collection-contact" className="br-public-request-flow br-card">
                <strong>Как работает подборка</strong>
                <ol className="br-public-request-flow__list">
                  <li>Уточните даты, гостей и количество комнат.</li>
                  <li>Выберите конкретный номер из этой подборки.</li>
                  <li>Отправьте заявку по выбранному номеру.</li>
                </ol>
              </div>
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
            </>
          }
        />

        {publicWarningText ? (
          <div className="br-inline-notice" style={{ marginTop: 18 }}>
            {publicWarningText}
          </div>
        ) : null}

        <section id="collection-rooms" className="br-section br-section--public">
          <div className="br-section-heading">
            <h2>Варианты в этой подборке</h2>
            <p>Здесь показаны только выбранные варианты по этой ссылке. Заявка всегда отправляется на конкретный номер, а не на объект целиком.</p>
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
              <span className="br-label">Комнаты</span>
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
              <ButtonLink href={`/c/${collection.slug}`} variant="secondary" fullWidth>
                Сбросить
              </ButtonLink>
            </div>
          </form>

          {filters.hasDates ? (
            <div className="br-inline-notice" style={{ marginTop: 18 }}>
              Показана доступность с {filters.checkIn} по {filters.checkOut}. Итоговая сумма считается по ночам.
            </div>
          ) : null}

          {sections.length || standaloneRooms.length ? (
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
                      {section.sourceKinds.includes("property") ? "Объект в подборке" : "Номер в подборке"}
                    </span>
                  </div>
                  <p className="br-collection-public-section__hint">
                    {section.sourceKinds.includes("property")
                      ? "Объект добавлен в подборку целиком, но перед заявкой гость всё равно выбирает конкретный номер."
                      : "В этом блоке подборки заявка отправляется только по конкретному номеру."}
                  </p>

                  <PublicRoomBrowser
                    publicBaseHref={`/c/${collection.slug}`}
                    propertySlug={section.property.slug}
                    rooms={section.rooms}
                    filters={filters}
                    showFilter={false}
                    showStickyCta
                    selectedRoomTitle="Выбранный номер из подборки"
                    selectedRoomDescription="Эта заявка будет создана на конкретный номер из персональной подборки."
                    selectionHint="Сначала выберите номер из подборки, затем переходите к заявке по нему."
                    cardActionLabel="Перейти к заявке по номеру"
                  />
                </article>
              ))}

              {standaloneRooms.length ? (
                <article className="br-card br-collection-public-section">
                  <div className="br-dashboard-block__header">
                    <div>
                      <h3>Отдельные номера в подборке</h3>
                      <p>Самостоятельные варианты размещения без привязки к объекту.</p>
                    </div>
                    <span className="br-collection-public-badge">Номера в подборке</span>
                  </div>
                  <p className="br-collection-public-section__hint">Для каждого варианта заявка отправляется только по конкретному номеру.</p>

                  <PublicRoomBrowser
                    publicBaseHref={`/c/${collection.slug}`}
                    rooms={standaloneRooms.map((item) => item.room)}
                    filters={filters}
                    showFilter={false}
                    showStickyCta
                    selectedRoomTitle="Выбранный номер из подборки"
                    selectedRoomDescription="Эта заявка будет создана на конкретный номер из персональной подборки."
                    selectionHint="Выберите номер из подборки и переходите к заявке только по нему."
                    cardActionLabel="Перейти к заявке по номеру"
                  />
                </article>
              ) : null}
            </div>
          ) : (
            <section className="br-dashboard-block br-card" style={{ marginTop: 24 }}>
              <div className="br-dashboard-block__header">
                <div>
                  <h3>В этой подборке пока нет доступных номеров</h3>
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
