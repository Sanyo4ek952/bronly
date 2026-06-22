import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import type { PublicRoom } from "@/entities/room";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { buildCanonicalUrl, createSeoMetadata, toJsonLd } from "@/shared/lib/seo";
import { ButtonLink, SectionSubtitle, SectionTitle } from "@/shared/ui";
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

function toPhoneHref(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

function toWhatsAppHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function toTelegramHref(value: string) {
  const normalized = value.replace(/^@/, "").trim();
  return normalized ? `https://t.me/${normalized}` : null;
}

function buildRequestHref(ownerSlug: string, room: PublicRoom, filters?: { checkIn: string; checkOut: string; adults: number; rooms: number; hasDates: boolean }) {
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
              {unavailable.showLogin ? (
                <ButtonLink href="/login" fullWidth>
                  Войти в кабинет
                </ButtonLink>
              ) : null}
              <ButtonLink href="/" variant="secondary" fullWidth>
                На главную
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
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
          <header className="br-header br-header--public">
            <BrandSlot />
            <nav className="br-nav" aria-label="Навигация публичной страницы владельца">
              <a href="#owner-filter">Подобрать номер</a>
              <a href="#owner-contact">Контакты</a>
              <a href="#owner-request-flow">Как работает заявка</a>
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
              <div className="br-public-hero__copy">
                <span className="br-public-hero__eyebrow">Гостевая витрина</span>
                <h1>{owner.displayName}</h1>
                <p>{buildOwnerHeroDescription(allRooms, owner.displayName)}</p>
              </div>
              <div id="owner-contact" className="br-public-hero__actions">
                <div className="br-public-contact-chips">
                  {owner.phone ? (
                    <a className="br-public-contact-chip" href={toPhoneHref(owner.phone) ?? undefined}>
                      {owner.phone}
                    </a>
                  ) : null}
                  {owner.whatsapp ? (
                    <a className="br-public-contact-chip" href={toWhatsAppHref(owner.whatsapp) ?? undefined} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  ) : null}
                  {owner.telegram ? (
                    <a className="br-public-contact-chip" href={toTelegramHref(owner.telegram) ?? undefined} target="_blank" rel="noreferrer">
                      {owner.telegram}
                    </a>
                  ) : null}
                </div>
                {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку на номер</ButtonLink> : null}
              </div>
            </div>
          </section>

          {publicWarningText ? <div className="br-inline-notice" style={{ marginTop: 18 }}>{publicWarningText}</div> : null}

          <section id="owner-filter" className="br-section br-section--public">
            <div className="br-section-heading">
              <SectionTitle>Подберите номер</SectionTitle>
              <SectionSubtitle>Фильтр работает по всей витрине владельца. Заявка всегда создаётся на конкретный номер.</SectionSubtitle>
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
                  <div className="br-section-copy">
                    <SectionTitle as="h3">Пока нет доступных вариантов</SectionTitle>
                    <SectionSubtitle>Владелец ещё не опубликовал объекты или отдельные номера для этой ссылки.</SectionSubtitle>
                  </div>
                </div>
              </section>
            )}
          </section>

          <section id="owner-request-flow" className="br-public-request-flow br-card">
            <div className="br-section-heading">
              <SectionTitle>Как работает заявка</SectionTitle>
              <SectionSubtitle>Bronly не подтверждает проживание от имени сервиса. Владелец свяжется с вами напрямую.</SectionSubtitle>
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
