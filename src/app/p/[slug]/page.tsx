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
import { ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";
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
      <main className="br-page">
        <div className="br-container">
          <PublicPageHeader
            actions={firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку</ButtonLink> : null}
            navigation={
              <nav className="br-nav" aria-label="Навигация публичной страницы владельца">
                <a href="#owner-filter">Подобрать номер</a>
                <a href="#owner-contact">Контакты</a>
                <a href="#owner-request-flow">Как работает заявка</a>
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
            actions={
              <>
                <div id="owner-contact" className="br-public-contact-chips">
                  {owner.phone ? (
                    <a className="br-public-contact-chip" href={toPhoneHref(owner.phone)}>
                      {owner.phone}
                    </a>
                  ) : null}
                  {owner.whatsapp ? (
                    <a className="br-public-contact-chip" href={toWhatsAppHref(owner.whatsapp)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  ) : null}
                  {owner.telegram ? (
                    <a className="br-public-contact-chip" href={toTelegramHref(owner.telegram)} target="_blank" rel="noreferrer">
                      {owner.telegram}
                    </a>
                  ) : null}
                </div>
                {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку на номер</ButtonLink> : null}
              </>
            }
          />

          {publicWarningText ? <div className="br-inline-notice" style={{ marginTop: 18 }}>{publicWarningText}</div> : null}

          <section id="owner-filter" className="br-section br-section--public">
            <div className="br-section-heading">
              <h2>Подберите номер</h2>
              <p>Фильтр работает по всей витрине владельца. Заявка всегда создаётся на конкретный номер.</p>
            </div>

            {allRooms.length ? (
              <PublicRoomBrowser
                publicBaseHref={`/p/${owner.slug}`}
                rooms={allRooms}
                filters={filters}
                resetHref={`/p/${owner.slug}`}
                showFilter
                showSelectedRoomSummary
                showStickyCta
              />
            ) : (
              <section className="br-dashboard-block br-card">
                <div className="br-dashboard-block__header">
                  <div>
                    <h3>Пока нет доступных вариантов</h3>
                    <p>Владелец ещё не опубликовал объекты или отдельные номера для этой ссылки.</p>
                  </div>
                </div>
              </section>
            )}
          </section>

          <section id="owner-request-flow" className="br-public-request-flow br-card">
            <div className="br-section-heading">
              <h2>Как работает заявка</h2>
              <p>Bronly не подтверждает проживание от имени сервиса. Владелец свяжется с вами напрямую.</p>
            </div>
            <ol className="br-public-request-flow__list">
              <li>Выберите конкретный номер по датам, гостям и комнатам.</li>
              <li>Оставьте заявку на выбранный номер.</li>
              <li>Владелец свяжется с вами для уточнения доступности и деталей проживания.</li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}
