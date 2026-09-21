import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, Phone, Send } from "lucide-react";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import {
  buildCanonicalUrl,
  buildSearchParams,
  createSeoMetadata,
  getSearchString,
  readSearchParams,
  toJsonLd,
  toPhoneHref,
  toTelegramHref,
  toWhatsAppHref,
} from "@/shared/lib";
import { AppIcon, InlineNotice } from "@/shared/ui";
import { PublicPropertySection } from "@/widgets/public-property-section";
import { PublicRoomBrowser, PublicStayFilter } from "@/widgets/public-room-browser";
import { PublicBrandSlot, PublicHero, PublicPageHeader, PublicUnavailableState } from "@/widgets/public-page";

type PublicPropertyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildOwnerRedirectHref(
  ownerSlug: string,
  query: Record<string, string | string[] | undefined>,
  matchedPropertySlug: string | null,
) {
  const params = buildSearchParams(query);

  if (matchedPropertySlug && !params.get("propertySlug")) {
    params.set("propertySlug", matchedPropertySlug);
  }

  const search = params.toString();
  return `/p/${ownerSlug}${search ? `?${search}` : ""}`;
}

function buildOwnerDescription(pageData: NonNullable<Awaited<ReturnType<typeof getPublicPropertyPageData>>>) {
  const city = pageData.properties[0]?.property.city || pageData.standaloneRooms[0]?.location?.city;
  const locationPart = city ? ` в ${city}` : "";

  return `Персональная страница владельца${locationPart}: номера, цены, календарь занятости и возможность оставить заявку на проживание.`;
}

function flattenOwnerRooms(pageData: NonNullable<Awaited<ReturnType<typeof getPublicPropertyPageData>>>) {
  const propertyRooms = pageData.properties.flatMap((section) =>
    section.rooms.map((room) => ({
      ...room,
      propertyTitle: room.propertyTitle ?? section.property.shortTitle,
      propertySlug: room.propertySlug ?? section.property.slug,
    })),
  );

  return [...propertyRooms, ...pageData.standaloneRooms];
}

export async function generateMetadata({ params }: PublicPropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSlug = await resolveOwnerPublicSlug(slug);

  if (!resolvedSlug) {
    return createSeoMetadata({
      title: "Страница владельца не найдена",
      description: "Публичная страница владельца недоступна.",
      path: `/p/${encodeURIComponent(slug)}`,
      index: false,
      openGraphType: "profile",
    });
  }

  const pageData = await getPublicPropertyPageData(resolvedSlug.ownerSlug);
  const canonicalPath = `/p/${encodeURIComponent(resolvedSlug.ownerSlug)}`;

  if (!pageData?.owner || pageData.publicUnavailableReason) {
    return createSeoMetadata({
      title: "Страница владельца временно недоступна",
      description: "Публичная страница владельца временно недоступна.",
      path: canonicalPath,
      index: false,
      openGraphType: "profile",
    });
  }

  const heroPhoto = pageData.properties[0]?.property.photos[0]?.url ?? pageData.standaloneRooms[0]?.photos?.[0]?.url ?? "/icon";

  return createSeoMetadata({
    title: `${pageData.owner.displayName} — персональная страница владельца`,
    description: buildOwnerDescription(pageData),
    path: canonicalPath,
    imagePath: heroPhoto,
    openGraphType: "profile",
  });
}

export default async function PublicPropertyPage({ params, searchParams }: PublicPropertyPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
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
      <PublicUnavailableState
        title={unavailable.title}
        description={unavailable.description}
        showLogin={unavailable.showLogin}
      />
    );
  }

  const { owner, filters, publicWarningText } = pageData;
  const allRooms = flattenOwnerRooms(pageData);
  const heroPhoto = pageData.properties[0]?.property.photos[0] ?? pageData.standaloneRooms[0]?.photos[0];
  const ownerJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: buildCanonicalUrl(`/p/${encodeURIComponent(owner.slug)}`),
    name: `${owner.displayName} — персональная страница владельца`,
    description: buildOwnerDescription(pageData),
    mainEntity: {
      "@type": "Person",
      name: owner.displayName,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(ownerJsonLd) }} />
      <main className="min-h-screen bg-[var(--color-page)] pb-[var(--safe-area-bottom)]">
        <div className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-4 sm:w-[calc(100%-64px)] sm:py-5">
          <PublicPageHeader
            variant="minimal"
            navigation={
              <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold sm:gap-7 sm:text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:hover:text-[var(--accent)] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]" aria-label="Навигация публичной страницы владельца">
                <a href="#owner-filter">Подобрать номер</a>
                <a href="#owner-contact">Контакты</a>
              </nav>
            }
          >
            <PublicBrandSlot />
          </PublicPageHeader>

          <PublicHero
            variant="compact"
            imageUrl={heroPhoto?.url}
            imageAlt="Фото жилья владельца"
            eyebrow="Страница владельца"
            title={owner.displayName}
            description="Выберите номер и оставьте заявку на проживание."
            actions={
                <div id="owner-contact" className="flex scroll-mt-6 flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-[var(--accent)] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-[var(--accent-strong)] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]">
                  {owner.phone ? (
                    <a href={toPhoneHref(owner.phone)} title={owner.phone}>
                      <AppIcon icon={Phone} className="size-4" aria-hidden="true" />Телефон
                    </a>
                  ) : null}
                  {owner.whatsapp ? (
                    <a href={toWhatsAppHref(owner.whatsapp)} target="_blank" rel="noreferrer">
                      <AppIcon icon={MessageCircle} className="size-4" aria-hidden="true" />WhatsApp
                    </a>
                  ) : null}
                  {owner.telegram ? (
                    <a href={toTelegramHref(owner.telegram)} target="_blank" rel="noreferrer">
                      <AppIcon icon={Send} className="size-4" aria-hidden="true" />Telegram
                    </a>
                  ) : null}
                </div>
            }
          />

          {publicWarningText ? <InlineNotice className="mt-[18px]" tone="warning">{publicWarningText}</InlineNotice> : null}

          <section id="owner-filter" className="grid scroll-mt-6 gap-5 pb-9 pt-2 sm:pb-12">
              <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Подберите номер</h2>

            <PublicStayFilter publicBaseHref={`/p/${owner.slug}`} filters={filters} resetHref={`/p/${owner.slug}`} variant="inline" />
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">Заявка не подтверждает проживание — владелец уточнит доступность.</p>
          </section>

            {allRooms.length ? (
              <div className="grid gap-8">
                {pageData.properties.length ? (
                  <section className="grid gap-5" aria-labelledby="owner-properties-title">
                    <div className="grid gap-2">
                      <h2 id="owner-properties-title" className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Объекты владельца</h2>
                    </div>
                    {pageData.properties.map((section) => (
                      <PublicPropertySection
                        key={section.property.id}
                        publicBaseHref={`/p/${owner.slug}`}
                        property={section.property}
                        rooms={section.rooms}
                        filters={filters}
                        titleAs="h3"
                        layout="list"
                      />
                    ))}
                  </section>
                ) : null}

                {pageData.standaloneRooms.length ? (
                  <section className="grid gap-5" aria-labelledby="owner-standalone-title">
                    <div className="grid gap-2">
                      <h2 id="owner-standalone-title" className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Отдельные номера</h2>
                    </div>
                    <PublicRoomBrowser
                      publicBaseHref={`/p/${owner.slug}`}
                      rooms={pageData.standaloneRooms}
                      filters={filters}
                      showFilter={false}
                      layout="list"
                    />
                  </section>
                ) : null}
              </div>
            ) : (
              <section className="border-y border-[var(--border)] py-8">
                <div>
                  <div>
                    <h3 className="text-xl font-extrabold">Пока нет доступных вариантов</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Владелец ещё не опубликовал объекты или отдельные номера для этой ссылки.</p>
                  </div>
                </div>
              </section>
            )}
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] py-5">
            <PublicBrandSlot />
            <a href="#owner-filter" className="inline-flex min-h-11 items-center text-sm text-[var(--text-muted)] underline-offset-4 hover:underline">Подобрать номер</a>
          </footer>
        </div>
      </main>
    </>
  );
}
