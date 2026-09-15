import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
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
} from "@/shared/lib";
import { ButtonLink, InlineNotice, Panel } from "@/shared/ui";
import { PublicPageHeader, PublicBrandSlot, PublicHero, PublicUnavailableState } from "@/widgets/public-page";
import { PublicPropertySection } from "@/widgets/public-property-section";
import { PublicRoomBrowser, PublicStayFilter } from "@/widgets/public-room-browser";

type PublicAgentPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildAgentDescription(pageData: NonNullable<Awaited<ReturnType<typeof getPublicAgentPageData>>>) {
  const city = pageData.properties[0]?.property.city || pageData.standaloneRooms[0]?.location?.city;
  const locationPart = city ? ` в ${city}` : "";

  return `Агентская витрина${locationPart}: варианты проживания, цены и возможность оставить заявку по ссылке агента.`;
}

function buildAgentHeroDescription(agentName: string, rooms: PublicRoom[]) {
  const firstRoom = rooms[0];
  const city = firstRoom?.location?.city?.trim();
  const propertyTitle = firstRoom?.propertyTitle?.trim();
  const locationPart = city ? `в ${city}` : "по этой ссылке";
  const roomPart = propertyTitle ? `${propertyTitle} и другие варианты` : "варианты проживания";

  return `${agentName} показывает ${roomPart} ${locationPart}. Выберите конкретный номер и оставьте заявку, а агент вручную сопровождает следующий шаг.`;
}

function buildAgentRequestHref(
  agentPublicId: string,
  room: PublicRoom,
  filters: { checkIn: string; checkOut: string; adults: number; rooms: number; hasDates: boolean },
) {
  const params = new URLSearchParams({ roomId: room.id });

  if (room.propertySlug) {
    params.set("propertySlug", room.propertySlug);
  }

  if (filters.hasDates) {
    params.set("checkIn", filters.checkIn);
    params.set("checkOut", filters.checkOut);
  }

  params.set("adults", String(filters.adults));
  params.set("rooms", String(filters.rooms));

  return `/a/${agentPublicId}/request?${params.toString()}`;
}

export async function generateMetadata({ params }: PublicAgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPublicAgentPageData(slug);

  if (!pageData) {
    return createSeoMetadata({
      title: "Агентская витрина не найдена",
      description: "Публичная страница агента недоступна.",
      path: `/a/${encodeURIComponent(slug)}`,
      index: false,
      openGraphType: "profile",
    });
  }

  const canonicalId = pageData.agent?.publicId ?? slug;
  const canonicalPath = `/a/${encodeURIComponent(canonicalId)}`;

  if (!pageData.agent || pageData.publicUnavailableReason) {
    return createSeoMetadata({
      title: "Агентская витрина временно недоступна",
      description: "Публичная страница агента временно недоступна.",
      path: canonicalPath,
      index: false,
      openGraphType: "profile",
    });
  }

  const heroPhoto = pageData.properties[0]?.property.photos[0]?.url ?? pageData.standaloneRooms[0]?.photos?.[0]?.url ?? "/icon";

  return createSeoMetadata({
    title: `${pageData.agent.displayName} — агентская витрина`,
    description: buildAgentDescription(pageData),
    path: canonicalPath,
    imagePath: heroPhoto,
    openGraphType: "profile",
  });
}

export default async function PublicAgentPage({ params, searchParams }: PublicAgentPageProps) {
  const [{ slug }, query] = await Promise.all([params, readSearchParams(searchParams)]);
  const pageData = await getPublicAgentPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

  if (!pageData) {
    notFound();
  }

  if (pageData.shouldRedirectToCanonical && pageData.agent?.publicId) {
    const redirectQuery = buildSearchParams(query);
    const suffix = redirectQuery.toString();
    redirect(`/a/${encodeURIComponent(pageData.agent.publicId)}${suffix ? `?${suffix}` : ""}`);
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return <PublicUnavailableState title={unavailable.title} description={unavailable.description} />;
  }

  const { agent, properties, standaloneRooms, filters, publicWarningText } = pageData;
  const allRooms = [
    ...properties.flatMap((section) =>
      section.rooms.map((room) => ({
        ...room,
        propertyTitle: room.propertyTitle ?? section.property.shortTitle,
        propertySlug: room.propertySlug ?? section.property.slug,
      })),
    ),
    ...standaloneRooms,
  ];
  const heroPhoto = properties[0]?.property.photos[0] ?? standaloneRooms[0]?.photos?.[0];
  const firstRequestHref = allRooms[0] ? buildAgentRequestHref(agent.publicId, allRooms[0], filters) : null;
  const agentJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: buildCanonicalUrl(`/a/${encodeURIComponent(agent.publicId)}`),
    name: `${agent.displayName} — агентская витрина`,
    description: buildAgentDescription(pageData),
    mainEntity: {
      "@type": "Person",
      name: agent.displayName,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(agentJsonLd) }} />
      <main className="min-h-screen bg-[var(--color-page)] pb-[var(--safe-area-bottom)]">
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1440px] py-5 max-[640px]:w-[calc(100%-24px)] sm:py-7">
          <PublicPageHeader
            actions={firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку</ButtonLink> : null}
            navigation={
              <nav className="flex w-full flex-wrap items-center justify-start gap-2.5 text-sm font-semibold [&_a]:inline-flex [&_a]:min-h-[38px] [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-[var(--color-border)] [&_a]:bg-[rgb(255_255_255_/_0.86)] [&_a]:px-[14px] [&_a]:font-bold [&_a]:transition [&_a]:hover:-translate-y-px [&_a]:hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] [&_a]:hover:bg-[var(--color-primary-pale)] [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-4 [&_a]:focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)] max-[640px]:[&_a]:w-full max-[640px]:[&_a]:justify-center" aria-label="Навигация агентской витрины">
                <a href="#agent-rooms">Варианты</a>
                <a href="#agent-contact">Контакты</a>
                <a href="#agent-request-flow">Как работает заявка</a>
              </nav>
            }
          >
            <PublicBrandSlot />
          </PublicPageHeader>

          {publicWarningText ? <InlineNotice className="mb-[18px]">{publicWarningText}</InlineNotice> : null}

          <PublicHero
            imageUrl={heroPhoto?.url}
            imageAlt={agent.displayName}
            eyebrow="Агентская витрина"
            title={agent.displayName}
            description={buildAgentHeroDescription(agent.displayName, allRooms)}
            notice={
              <InlineNotice tone="soft">
                В агентской витрине показана итоговая цена агента. Базовую цену владельца агент не меняет.
              </InlineNotice>
            }
            actions={
              <>
                <div id="agent-contact" className="flex flex-wrap gap-2.5">
                  {agent.phone ? (
                    <a className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" href={toPhoneHref(agent.phone)}>
                      {agent.phone}
                    </a>
                  ) : null}
                  {agent.telegram ? (
                    <a className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.90)] px-[14px] text-sm font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" href={toTelegramHref(agent.telegram)} target="_blank" rel="noreferrer">
                      {agent.telegram}
                    </a>
                  ) : null}
                </div>
                {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку на номер</ButtonLink> : null}
              </>
            }
          />

          {properties.length || standaloneRooms.length ? (
            <section id="agent-rooms" className="grid gap-6 py-7 sm:py-9">
              <div className="grid gap-3">
                <h2>Подберите номер</h2>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">Гость выбирает конкретный номер и оставляет заявку по нему. Агент получает заявку и вручную сопровождает связь с владельцем.</p>
              </div>

              <PublicStayFilter publicBaseHref={`/a/${agent.publicId}`} filters={filters} />

              <div className="grid gap-5">
                {properties.map((section) => (
                  <PublicPropertySection
                    key={section.property.id}
                    publicBaseHref={`/a/${agent.publicId}`}
                    property={section.property}
                    rooms={section.rooms}
                    filters={filters}
                    showFilter={false}
                    titleAs="h2"
                  />
                ))}

                {standaloneRooms.length ? (
                  <Panel className="grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]" surface="raised" padding="lg">
                    <div className="grid gap-2">
                      <h2 className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Отдельные номера</h2>
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">Самостоятельные варианты размещения без привязки к объекту.</p>
                    </div>

                    <PublicRoomBrowser publicBaseHref={`/a/${agent.publicId}`} rooms={standaloneRooms} filters={filters} showFilter={false} />
                  </Panel>
                ) : null}
              </div>
            </section>
          ) : (
            <Panel className="my-7 grid gap-2 p-6" surface="subtle">
              <h2 className="text-xl font-bold">Пока нет доступных вариантов</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">Агентская витрина появится после активного сотрудничества с владельцем.</p>
            </Panel>
          )}

          <Panel id="agent-request-flow" as="section" className="mb-10 grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]" surface="raised" padding="lg">
            <div className="grid gap-3">
              <h2 className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Как работает заявка</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">Bronly не подтверждает проживание от имени сервиса. Агент получает заявку и вручную сопровождает следующий шаг.</p>
            </div>
            <ol className="grid list-decimal gap-3 pl-6 marker:font-extrabold marker:text-[var(--color-primary-hover)]">
              <li>Выберите конкретный номер по датам, гостям и комнатам.</li>
              <li>Оставьте заявку по выбранному номеру.</li>
              <li>Агент свяжется с вами и при необходимости передаст заявку владельцу для уточнения доступности.</li>
            </ol>
          </Panel>
        </div>
      </main>
    </>
  );
}
