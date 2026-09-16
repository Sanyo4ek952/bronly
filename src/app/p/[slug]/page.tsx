import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import type { PublicRoom } from "@/entities/room";
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
import { ButtonLink, InlineNotice, Panel } from "@/shared/ui";
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

function buildOwnerHeroDescription(allRooms: PublicRoom[], ownerName: string) {
  const firstRoom = allRooms[0];
  const city = firstRoom?.location?.city?.trim();
  const propertyTitle = firstRoom?.propertyTitle?.trim();
  const locationPart = city ? `в ${city}` : "по этой ссылке";
  const roomPart = propertyTitle ? `${propertyTitle} и другие номера` : "подходящие номера";

  return `${ownerName} показывает ${roomPart} ${locationPart}. Выберите конкретный номер и оставьте запрос на проживание.`;
}

function buildRequestHref(
  ownerSlug: string,
  room: PublicRoom,
  filters?: { checkIn: string; checkOut: string; adults: number; rooms: number; hasDates: boolean },
) {
  const params = new URLSearchParams({ roomId: room.id });

  if (room.propertySlug) {
    params.set("propertySlug", room.propertySlug);
  }

  if (filters?.hasDates) {
    params.set("checkIn", filters.checkIn);
    params.set("checkOut", filters.checkOut);
  }

  if (filters) {
    params.set("adults", String(filters.adults));
    params.set("rooms", String(filters.rooms));
  }

  return `/p/${ownerSlug}/request?${params.toString()}`;
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
  const defaultRoom = allRooms.find((room) => room.isAvailableForFilter) ?? allRooms[0] ?? null;
  const firstRequestHref = defaultRoom ? buildRequestHref(owner.slug, defaultRoom, filters) : null;
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
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1440px] py-5 sm:py-7">
          <PublicPageHeader
            navigation={
              <nav className="flex w-full flex-wrap items-center justify-start gap-2.5 text-sm font-semibold [&_a]:inline-flex [&_a]:min-h-[38px] [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-[var(--color-border)] [&_a]:bg-[rgb(255_255_255_/_0.86)] [&_a]:px-[14px] [&_a]:font-bold [&_a]:transition [&_a]:hover:-translate-y-px [&_a]:hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] [&_a]:hover:bg-[var(--color-primary-pale)] [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-4 [&_a]:focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)] max-[640px]:[&_a]:w-full max-[640px]:[&_a]:justify-center" aria-label="Навигация публичной страницы владельца">
                <a href="#owner-filter">Подобрать номер</a>
                <a href="#owner-contact">Контакты</a>
              </nav>
            }
          >
            <PublicBrandSlot />
          </PublicPageHeader>

          <PublicHero
            imageUrl={heroPhoto?.url}
            imageAlt={owner.displayName}
            eyebrow="Гостевая витрина"
            title={owner.displayName}
            description={buildOwnerHeroDescription(allRooms, owner.displayName)}
            notice={<InlineNotice tone="soft">Показаны только варианты этого владельца. Заявка не подтверждает проживание — владелец отдельно уточнит доступность.</InlineNotice>}
            actions={
              <>
                <div id="owner-contact" className="flex flex-wrap gap-2.5">
                  {owner.phone ? (
                    <a className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" href={toPhoneHref(owner.phone)}>
                      {owner.phone}
                    </a>
                  ) : null}
                  {owner.whatsapp ? (
                    <a className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" href={toWhatsAppHref(owner.whatsapp)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  ) : null}
                  {owner.telegram ? (
                    <a className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" href={toTelegramHref(owner.telegram)} target="_blank" rel="noreferrer">
                      {owner.telegram}
                    </a>
                  ) : null}
                </div>
                {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку на номер</ButtonLink> : null}
              </>
            }
          />

          {publicWarningText ? <InlineNotice className="mt-[18px]" tone="warning">{publicWarningText}</InlineNotice> : null}

          <section id="owner-filter" className="grid gap-6 py-9 sm:py-12">
            <div className="grid gap-3">
              <h2 className="text-[clamp(1.7rem,2.6vw,2.5rem)] font-extrabold leading-tight">Подберите номер</h2>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">Фильтр работает только по вариантам этого владельца. Заявка всегда создаётся на конкретный номер.</p>
            </div>

            <PublicStayFilter publicBaseHref={`/p/${owner.slug}`} filters={filters} resetHref={`/p/${owner.slug}`} />

            {allRooms.length ? (
              <div className="grid gap-8">
                {pageData.properties.length ? (
                  <section className="grid gap-[18px]" aria-labelledby="owner-properties-title">
                    <div className="grid gap-2">
                      <h2 id="owner-properties-title" className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Объекты владельца</h2>
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">В каждом объекте показаны только его активные номера.</p>
                    </div>
                    {pageData.properties.map((section) => (
                      <PublicPropertySection
                        key={section.property.id}
                        publicBaseHref={`/p/${owner.slug}`}
                        property={section.property}
                        rooms={section.rooms}
                        filters={filters}
                        titleAs="h3"
                      />
                    ))}
                  </section>
                ) : null}

                {pageData.standaloneRooms.length ? (
                  <Panel as="section" className="grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]" surface="raised" padding="lg">
                    <div className="grid gap-2">
                      <h2 className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Отдельные номера</h2>
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">Эти варианты не привязаны к объекту и имеют собственный адрес.</p>
                    </div>
                    <PublicRoomBrowser
                      publicBaseHref={`/p/${owner.slug}`}
                      rooms={pageData.standaloneRooms}
                      filters={filters}
                      showFilter={false}
                    />
                  </Panel>
                ) : null}
              </div>
            ) : (
              <Panel as="section" surface="subtle" padding="lg">
                <div>
                  <div>
                    <h3 className="text-xl font-extrabold">Пока нет доступных вариантов</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Владелец ещё не опубликовал объекты или отдельные номера для этой ссылки.</p>
                  </div>
                </div>
              </Panel>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
