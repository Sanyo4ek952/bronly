import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import type { PublicRoom } from "@/entities/room";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import {
  buildCanonicalUrl,
  createSeoMetadata,
  getSearchString,
  readSearchParams,
  toJsonLd,
  toPhoneHref,
  toTelegramHref,
} from "@/shared/lib";
import { ButtonLink } from "@/shared/ui";
import { PublicPageHeader, PublicBrandSlot, PublicHero, PublicUnavailableState } from "@/widgets/public-page";
import { PublicPropertySection } from "@/widgets/public-property-section";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

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
    redirect(`/a/${pageData.agent.publicId}`);
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
      <main className="br-page">
        <div className="br-container">
          <PublicPageHeader
            actions={firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку</ButtonLink> : null}
            navigation={
              <nav className="br-nav" aria-label="Навигация агентской витрины">
                <a href="#agent-rooms">Варианты</a>
                <a href="#agent-contact">Контакты</a>
                <a href="#agent-request-flow">Как работает заявка</a>
              </nav>
            }
          >
            <PublicBrandSlot />
          </PublicPageHeader>

          {publicWarningText ? <div className="br-inline-notice">{publicWarningText}</div> : null}

          <PublicHero
            imageUrl={heroPhoto?.url}
            imageAlt={agent.displayName}
            eyebrow="Агентская витрина"
            title={agent.displayName}
            description={buildAgentHeroDescription(agent.displayName, allRooms)}
            notice={
              <div className="br-inline-notice br-inline-notice--soft">
                В агентской витрине показана итоговая цена агента. Базовую цену владельца агент не меняет.
              </div>
            }
            actions={
              <>
                <div id="agent-contact" className="br-public-contact-chips">
                  {agent.phone ? (
                    <a className="br-public-contact-chip" href={toPhoneHref(agent.phone)}>
                      {agent.phone}
                    </a>
                  ) : null}
                  {agent.telegram ? (
                    <a className="br-public-contact-chip" href={toTelegramHref(agent.telegram)} target="_blank" rel="noreferrer">
                      {agent.telegram}
                    </a>
                  ) : null}
                </div>
                {firstRequestHref ? <ButtonLink href={firstRequestHref}>Оставить заявку на номер</ButtonLink> : null}
              </>
            }
          />

          {properties.length || standaloneRooms.length ? (
            <section id="agent-rooms" className="br-section br-section--public">
              <div className="br-section-heading">
                <h2>Подберите номер</h2>
                <p>Гость выбирает конкретный номер и оставляет заявку по нему. Агент получает заявку и вручную сопровождает связь с владельцем.</p>
              </div>

              <div className="br-owner-stack">
                {properties.map((section) => (
                  <PublicPropertySection
                    key={section.property.id}
                    publicBaseHref={`/a/${agent.publicId}`}
                    property={section.property}
                    rooms={section.rooms}
                    filters={filters}
                    showFilter
                    titleAs="h2"
                  />
                ))}

                {standaloneRooms.length ? (
                  <section className="br-dashboard-block br-card">
                    <div className="br-dashboard-block__header">
                      <div>
                        <h2>Отдельные номера</h2>
                        <p>Самостоятельные варианты размещения без привязки к объекту.</p>
                      </div>
                    </div>

                    <PublicRoomBrowser publicBaseHref={`/a/${agent.publicId}`} rooms={standaloneRooms} filters={filters} />
                  </section>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="br-dashboard-block br-card">
              <div className="br-dashboard-block__header">
                <div>
                  <h2>Пока нет доступных вариантов</h2>
                  <p>Агентская витрина появится после активного сотрудничества с владельцем.</p>
                </div>
              </div>
            </section>
          )}

          <section id="agent-request-flow" className="br-public-request-flow br-card">
            <div className="br-section-heading">
              <h2>Как работает заявка</h2>
              <p>Bronly не подтверждает проживание от имени сервиса. Агент получает заявку и вручную сопровождает следующий шаг.</p>
            </div>
            <ol className="br-public-request-flow__list">
              <li>Выберите конкретный номер по датам, гостям и комнатам.</li>
              <li>Оставьте заявку по выбранному номеру.</li>
              <li>Агент свяжется с вами и при необходимости передаст заявку владельцу для уточнения доступности.</li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}
