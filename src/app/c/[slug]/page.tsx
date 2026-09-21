import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicCollectionPageData } from "@/entities/collection";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import {
  createSeoMetadata,
  getSearchString,
  readSearchParams,
  toPhoneHref,
  toTelegramHref,
  toWhatsAppHref,
} from "@/shared/lib";
import { InlineNotice, Panel, StatusPill } from "@/shared/ui";
import { PublicBrandSlot, PublicHero, PublicPageHeader, PublicUnavailableState } from "@/widgets/public-page";
import { PublicPropertyBrowser } from "@/widgets/public-property-section";
import { PublicRoomBrowser, PublicStayFilter } from "@/widgets/public-room-browser";

import { CollectionOpenTracker } from "./collection-open-tracker";

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

  return filters.hasDates
    ? `${filters.checkIn} — ${filters.checkOut} • ${guestsLabel} • ${roomsLabel}`
    : `${guestsLabel} • ${roomsLabel}`;
}

export async function generateMetadata({ params }: PublicCollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPublicCollectionPageData(slug);
  const publicTitle = pageData?.collection?.guestLabel || pageData?.collection?.title;

  return createSeoMetadata({
    title: publicTitle ? `${publicTitle} — подборка вариантов` : "Подборка вариантов проживания",
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

  const { collection, contact, sections, standaloneRooms, filters, publicWarningText } = pageData;
  const heroPhoto = sections[0]?.property.photos[0] ?? standaloneRooms[0]?.room.photos[0];
  const staySummary = formatCollectionStaySummary(filters);
  const publicTitle = collection.guestLabel || collection.title;
  return (
    <main className="min-h-screen bg-[var(--color-page)] pb-[var(--safe-area-bottom)]">
      <CollectionOpenTracker slug={collection.slug} />
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1440px] py-5 sm:py-7">
        <PublicPageHeader
          navigation={
            <nav className="flex w-full flex-wrap items-center justify-start gap-2.5 text-sm font-semibold [&_a]:inline-flex [&_a]:min-h-[38px] [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-[var(--color-border)] [&_a]:bg-[rgb(255_255_255_/_0.86)] [&_a]:px-[14px] [&_a]:font-bold [&_a]:transition [&_a]:hover:-translate-y-px [&_a]:hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] [&_a]:hover:bg-[var(--color-primary-pale)] [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-4 [&_a]:focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)] max-[640px]:[&_a]:w-full max-[640px]:[&_a]:justify-center" aria-label="Навигация коллекции">
              <a href="#collection-rooms">Варианты</a>
              <a href="#collection-contact">Контакты</a>
              <a href="#collection-request-flow">Как работает заявка</a>
            </nav>
          }
        >
          <PublicBrandSlot />
        </PublicPageHeader>

        <PublicHero
          imageUrl={heroPhoto?.url}
          imageAlt={publicTitle}
          eyebrow={collection.creatorRole === "agent" ? "Подборка агента" : "Подборка владельца"}
          title={publicTitle}
          description="Персональная подборка по прямой ссылке. Здесь нет общего каталога или рекомендаций за пределами выбранных вариантов."
          summary={
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel as="div" className="grid gap-1" padding="md" surface="subtle">
                <span className="text-xs text-[var(--text-muted)]">Подборка</span>
                <strong>{publicTitle}</strong>
              </Panel>
              <Panel as="div" className="grid gap-1" padding="md" surface="subtle">
                <span className="text-xs text-[var(--text-muted)]">{filters.hasDates ? "Даты, гости и комнаты" : "Текущие параметры"}</span>
                <strong>{staySummary}</strong>
              </Panel>
            </div>
          }
          notice={<InlineNotice tone="soft">Даже если объект добавлен целиком, заявка отправляется только по выбранному конкретному номеру.</InlineNotice>}
          actions={
            <>
              <div id="collection-contact" className="flex flex-wrap gap-2.5">
                {contact.phone ? <ContactLink href={toPhoneHref(contact.phone)}>{contact.phone}</ContactLink> : null}
                {contact.whatsapp ? <ContactLink href={toWhatsAppHref(contact.whatsapp)} external>WhatsApp</ContactLink> : null}
                {contact.telegram ? <ContactLink href={toTelegramHref(contact.telegram)} external>Telegram</ContactLink> : null}
              </div>
            </>
          }
        />

        {publicWarningText ? <InlineNotice className="mt-[18px]" tone="warning">{publicWarningText}</InlineNotice> : null}

        <section id="collection-rooms" className="grid gap-6 py-9 sm:py-12">
          <div className="grid gap-3">
            <h2 className="text-[clamp(1.7rem,2.6vw,2.5rem)] font-extrabold leading-tight">Варианты в этой подборке</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">Показаны только выбранные объекты и номера. Цены рассчитаны из актуальных базовых, сезонных и, для агентской подборки, агентских условий.</p>
          </div>

          <PublicStayFilter publicBaseHref={`/c/${collection.slug}`} filters={filters} resetHref={`/c/${collection.slug}`} />

          {sections.length || standaloneRooms.length ? (
            <div className="grid gap-6">
              <PublicPropertyBrowser sections={sections} publicBaseHref={`/c/${encodeURIComponent(collection.slug)}`} filters={filters} />

              {standaloneRooms.length ? (
                <Panel as="article" className="grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]" padding="lg" surface="raised">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <h3 className="text-[clamp(1.3rem,2vw,1.75rem)] font-extrabold">Отдельные номера в подборке</h3>
                      <p className="text-sm text-[var(--color-muted)]">Самостоятельные варианты размещения без привязки к объекту.</p>
                    </div>
                    <StatusPill variant="neutral">Номера в подборке</StatusPill>
                  </div>
                  <PublicRoomBrowser
                    publicBaseHref={`/c/${collection.slug}`}
                    rooms={standaloneRooms.map((item) => item.room)}
                    filters={filters}
                    showFilter={false}
                  />
                </Panel>
              ) : null}
            </div>
          ) : (
            <Panel as="section" padding="lg" surface="subtle">
              <h3 className="text-xl font-extrabold">В этой подборке пока нет доступных номеров</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Свяжитесь с автором подборки или откройте ссылку позже.</p>
            </Panel>
          )}
        </section>

        <Panel id="collection-request-flow" as="section" className="mb-10 grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]" padding="lg" surface="raised">
          <div className="grid gap-3">
            <h2 className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Как работает заявка</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">Bronly не подтверждает проживание от имени сервиса.</p>
          </div>
          <ol className="grid list-decimal gap-3 pl-6 marker:font-extrabold marker:text-[var(--color-primary-hover)]">
            <li>Уточните даты, гостей и количество комнат.</li>
            <li>Выберите конкретный номер из этой подборки.</li>
            <li>Отправьте заявку, и с вами свяжутся для уточнения доступности.</li>
          </ol>
        </Panel>
      </div>
    </main>
  );
}

function ContactLink({ href, external = false, children }: { href?: string; external?: boolean; children: React.ReactNode }) {
  if (!href) {
    return null;
  }

  return (
    <a
      className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
