import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Phone, Send } from "lucide-react";

import { getPublicAgentPageData } from "@/entities/collaboration";
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
import { AppIcon, InlineNotice } from "@/shared/ui";
import { PublicPageHeader, PublicBrandSlot, PublicHero, PublicUnavailableState } from "@/widgets/public-page";
import { PublicPropertyBrowser } from "@/widgets/public-property-section";
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
  const heroPhoto = properties[0]?.property.photos[0] ?? standaloneRooms[0]?.photos?.[0];
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
        <div className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-4 sm:w-[calc(100%-64px)] sm:py-5">
          <PublicPageHeader
            variant="minimal"
            navigation={
              <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold sm:gap-7 sm:text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:hover:text-[var(--accent)] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]" aria-label="Навигация агентской витрины">
                <a href="#agent-rooms">Подобрать номер</a>
                <a href="#agent-contact">Контакты</a>
              </nav>
            }
          >
            <PublicBrandSlot />
          </PublicPageHeader>

          <PublicHero
            variant="compact"
            imageUrl={heroPhoto?.url}
            imageAlt="Фото жилья в витрине агента"
            eyebrow="Агентская витрина"
            title={agent.displayName}
            description="Посмотрите объекты и номера, выберите подходящий вариант проживания."
            actions={
                <div id="agent-contact" className="flex scroll-mt-6 flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-[var(--accent)] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-[var(--accent-strong)] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]">
                  {agent.phone ? (
                    <a href={toPhoneHref(agent.phone)} title={agent.phone}>
                      <AppIcon icon={Phone} className="size-4" aria-hidden="true" />Телефон
                    </a>
                  ) : null}
                  {agent.telegram ? (
                    <a href={toTelegramHref(agent.telegram)} target="_blank" rel="noreferrer">
                      <AppIcon icon={Send} className="size-4" aria-hidden="true" />Telegram
                    </a>
                  ) : null}
                </div>
            }
          />

          {publicWarningText ? <InlineNotice className="mt-[18px]" tone="warning">{publicWarningText}</InlineNotice> : null}

          <section id="agent-rooms" className="grid scroll-mt-6 gap-5 pb-9 pt-2 sm:pb-12">
            <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Подберите номер</h2>
            <PublicStayFilter publicBaseHref={`/a/${agent.publicId}`} filters={filters} variant="inline" />
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">Заявка не подтверждает проживание — агент свяжется с вами для уточнения доступности.</p>
          </section>

          {properties.length || standaloneRooms.length ? (
            <div className="grid gap-8">
              {properties.length ? (
                <section className="grid gap-5" aria-labelledby="agent-properties-title">
                  <h2 id="agent-properties-title" className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Объекты в витрине</h2>
                <PublicPropertyBrowser sections={properties} publicBaseHref={`/a/${encodeURIComponent(agent.publicId)}`} filters={filters} />
                </section>
              ) : null}

                {standaloneRooms.length ? (
                  <section className="grid gap-5" aria-labelledby="agent-standalone-title">
                    <h2 id="agent-standalone-title" className="text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-tight">Отдельные номера</h2>

                    <PublicRoomBrowser publicBaseHref={`/a/${agent.publicId}`} rooms={standaloneRooms} filters={filters} showFilter={false} layout="list" />
                  </section>
                ) : null}
            </div>
          ) : (
            <section className="grid gap-2 border-y border-[var(--border)] py-8">
              <h2 className="text-xl font-bold">Пока нет доступных вариантов</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">Агентская витрина появится после активного сотрудничества с владельцем.</p>
            </section>
          )}

          <section id="agent-request-flow" className="mt-10 grid scroll-mt-6 gap-5 border-t border-[var(--border)] pt-8">
            <div className="grid gap-3">
              <h2 className="text-[clamp(1.4rem,2vw,1.9rem)] font-extrabold leading-tight">Как работает заявка</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">В витрине показана итоговая цена агента. Bronly не подтверждает проживание от имени сервиса.</p>
            </div>
            <ol className="grid list-decimal gap-3 pl-6 marker:font-extrabold marker:text-[var(--color-primary-hover)]">
              <li>Выберите конкретный номер по датам, гостям и комнатам.</li>
              <li>Оставьте заявку по выбранному номеру.</li>
              <li>Агент свяжется с вами и при необходимости передаст заявку владельцу для уточнения доступности.</li>
            </ol>
          </section>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] py-5">
            <PublicBrandSlot />
            <nav className="flex flex-wrap gap-x-6 text-sm text-[var(--text-muted)] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:underline-offset-4 [&_a]:hover:underline" aria-label="Навигация внизу агентской витрины">
              <a href="#agent-rooms">Подобрать номер</a>
              <a href="#agent-request-flow">Как работает заявка</a>
            </nav>
          </footer>
        </div>
      </main>
    </>
  );
}
