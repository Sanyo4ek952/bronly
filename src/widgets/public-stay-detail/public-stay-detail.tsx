import "server-only";

import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublicPropertyPageData, resolveOwnerPublicSlug } from "@/entities/property";
import { findPublicDetail, type PublicBrowseSection } from "@/entities/property/model/public-browse";
import { getPublicAgentPageData } from "@/entities/collaboration";
import { getPublicCollectionPageData } from "@/entities/collection";
import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { buildPublicRoomQuote, normalizePublicStayFilters } from "@/entities/room";
import { createSeoMetadata, formatRubles, getRussianPluralForm, getSearchString, readSearchParams, toPhoneHref, toTelegramHref, toMaxHref } from "@/shared/lib";
import { buildPublicDetailHref, buildPublicRequestHref, buildPublicStayHref } from "@/shared/lib/public-links";
import { getPublicUnavailableContent, type PublicUnavailableReason } from "@/shared/lib/public-page-visibility";
import { ButtonLink, InlineNotice } from "@/shared/ui";
import { ExpandableText } from "@/shared/ui/expandable-text";
import { PublicBrandSlot, PublicPageHeader, PublicUnavailableState } from "@/widgets/public-page";
import { PublicPropertyDetails, PublicDetailList, PublicCheckInTimes } from "@/widgets/public-property-section/public-property-section";
import { PublicRoomBrowser, PublicStayFilter } from "@/widgets/public-room-browser";
import { RoomPhotoCarousel } from "@/widgets/room-detail-page/room-photo-carousel";

type ContextKind = "p" | "a" | "c";
type DetailKind = "properties" | "rooms";
type Query = Record<string, string | string[] | undefined>;
type RouteProps = { params: Promise<{ slug: string; propertyId?: string; roomId?: string }>; searchParams?: Promise<Query> };
type PublicDetailContext = {
  base: string;
  title: string;
  contact: { displayName: string; phone: string; maxUrl?: string; telegram: string } | null;
  sections: PublicBrowseSection[];
  standaloneRooms: PublicRoom[];
  filters: PublicStayFilters;
  unavailable: PublicUnavailableReason | null;
  warning: string | null;
  shouldRedirect: boolean;
};

const loadContext = cache(async (kind: ContextKind, slug: string): Promise<PublicDetailContext | null> => {
  if (kind === "p") {
    const resolved = await resolveOwnerPublicSlug(slug);
    if (!resolved) return null;
    const data = await getPublicPropertyPageData(resolved.ownerSlug);
    if (!data) return null;
    return { base: `/p/${encodeURIComponent(resolved.ownerSlug)}`, title: "Страница владельца", contact: data.owner, sections: data.properties, standaloneRooms: data.standaloneRooms, filters: data.filters, unavailable: data.publicUnavailableReason, warning: data.publicWarningText, shouldRedirect: resolved.shouldRedirect };
  }
  if (kind === "a") {
    const data = await getPublicAgentPageData(slug);
    if (!data) return null;
    return { base: `/a/${encodeURIComponent(data.agent?.publicId ?? slug)}`, title: "Витрина агента", contact: data.agent, sections: data.properties, standaloneRooms: data.standaloneRooms, filters: data.filters, unavailable: data.publicUnavailableReason, warning: data.publicWarningText, shouldRedirect: data.shouldRedirectToCanonical };
  }
  const data = await getPublicCollectionPageData(slug);
  if (!data) return null;
  return { base: `/c/${encodeURIComponent(data.collection?.slug ?? slug)}`, title: data.collection?.guestLabel || data.collection?.title || "Подборка", contact: data.contact, sections: data.sections, standaloneRooms: data.standaloneRooms.map((item) => item.room), filters: data.filters, unavailable: data.publicUnavailableReason, warning: data.publicWarningText, shouldRedirect: false };
});

function roomTitle(room: PublicRoom) {
  return /^\d+$/.test(room.title.trim()) ? `Номер ${room.title}` : room.title;
}

function ContactLinks({ contact }: { contact: NonNullable<PublicDetailContext["contact"]> }) {
  return <section id="detail-contact" className="grid scroll-mt-5 gap-2 border-t border-[var(--border)] pt-5" aria-label="Контакты">
    <h2 className="text-xl font-bold">Контакты</h2><p>{contact.displayName}</p>
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[var(--accent)] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]">
      {contact.phone ? <a href={toPhoneHref(contact.phone)}>Телефон: {contact.phone}</a> : null}
      {toMaxHref(contact.maxUrl) ? <a href={toMaxHref(contact.maxUrl)} target="_blank" rel="noreferrer">MAX</a> : null}
      {contact.telegram ? <a href={toTelegramHref(contact.telegram)} target="_blank" rel="noreferrer">Telegram</a> : null}
    </div>
  </section>;
}

export function createPublicDetailRoute(contextKind: ContextKind, detailKind: DetailKind) {
  async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const route = await params;
    const id = (detailKind === "properties" ? route.propertyId : route.roomId) ?? "";
    const context = await loadContext(contextKind, route.slug);
    const detail = context && !context.unavailable && context.contact ? findPublicDetail(context.sections, context.standaloneRooms, detailKind, id) : null;
    const title = detail?.room ? roomTitle(detail.room) : detail?.section?.property.title;
    const description = detail?.room?.location?.description || detail?.section?.property.shortDescription || "Фотографии, описание и условия проживания. Выберите номер и оставьте заявку.";
    return createSeoMetadata({ title: title ?? "Вариант проживания недоступен", description: detail ? description : "Этот вариант проживания сейчас недоступен.", path: `${context?.base ?? `/${contextKind}/${encodeURIComponent(route.slug)}`}/${detailKind}/${encodeURIComponent(id)}`, imagePath: detail?.room?.photos[0]?.url ?? detail?.section?.property.photos[0]?.url, index: Boolean(detail) && contextKind !== "c" });
  }

  async function Page({ params, searchParams }: RouteProps) {
    const [route, query] = await Promise.all([params, readSearchParams(searchParams)]);
    const id = (detailKind === "properties" ? route.propertyId : route.roomId) ?? "";
    const loadedContext = await loadContext(contextKind, route.slug);
    if (!loadedContext) notFound();
    const filters = normalizePublicStayFilters({ checkIn: getSearchString(query, "checkIn"), checkOut: getSearchString(query, "checkOut"), adults: getSearchString(query, "adults"), rooms: getSearchString(query, "rooms") });
    const context = { ...loadedContext, filters };
    if (context.shouldRedirect) redirect(buildPublicDetailHref(context.base, detailKind, id, context.filters));
    if (context.unavailable || !context.contact) {
      const content = getPublicUnavailableContent(contextKind === "p" ? "ownerPage" : contextKind === "a" ? "agent" : "collection", context.unavailable);
      return <PublicUnavailableState title={content.title} description={content.description} />;
    }
    const detail = findPublicDetail(context.sections, context.standaloneRooms, detailKind, id);
    if (!detail) notFound();
    const section = detail.section ? { ...detail.section, rooms: detail.section.rooms.map((room) => buildPublicRoomQuote(room, filters)) } : null;
    const room = detail.room ? buildPublicRoomQuote(detail.room, filters) : null;
    const property = section?.property;
    const title = room ? roomTitle(room) : property!.title;
    const rootHref = buildPublicStayHref(context.base, context.filters);
    const backHref = room && property ? buildPublicDetailHref(context.base, "properties", property.id, context.filters) : rootHref;
    const currentPath = `${context.base}/${detailKind}/${encodeURIComponent(id)}`;

    return <main className="min-h-screen bg-[var(--color-page)] pb-[var(--safe-area-bottom)]">
      <div className="mx-auto grid w-[calc(100%-32px)] max-w-[1200px] gap-6 py-4 sm:w-[calc(100%-64px)] sm:py-5">
        <PublicPageHeader variant="minimal"><PublicBrandSlot /></PublicPageHeader>
        <nav aria-label="Навигация по жилью" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--accent)] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-[var(--accent)]">
          <Link href={backHref} className="underline underline-offset-4">← {room && property ? "К объекту" : "К вариантам"}</Link>
          {room && property ? <Link href={rootHref} className="underline underline-offset-4">{context.title}</Link> : null}
          <ButtonLink href="#detail-contact" className="ml-auto">Контакты</ButtonLink>
        </nav>
        <header className="grid gap-2"><p className="text-sm text-[var(--text-muted)]">{room ? property ? property.shortTitle : "Отдельный номер" : property?.propertyType || "Объект"}</p><h1 className="text-3xl font-extrabold leading-tight [overflow-wrap:anywhere] sm:text-4xl">{title}</h1></header>
        {context.warning ? <InlineNotice tone="warning">{context.warning}</InlineNotice> : null}
        {room ? <>
          <RoomPhotoCarousel variant="public" photos={room.photos} roomTitle={title} />
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
            <span>{room.capacity} {getRussianPluralForm(room.capacity, ["гость", "гостя", "гостей"])}</span>
            <span>{room.bedrooms} {getRussianPluralForm(room.bedrooms, ["комната", "комнаты", "комнат"])}</span>
            {room.area > 0 ? <span>{room.area} м²</span> : null}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{[room.location?.city || property?.city, room.location?.address || property?.address].filter(Boolean).join(", ")}</p>
          {room.subtitle ? <p className="whitespace-pre-line leading-relaxed">{room.subtitle}</p> : null}
          {room.location?.description ? <ExpandableText text={room.location.description} /> : null}
          <PublicDetailList title="Удобства номера" items={room.amenities} />
          <PublicCheckInTimes checkIn={room.location?.checkInTime || property?.checkInTime} checkOut={room.location?.checkOutTime || property?.checkOutTime} />
          <section id="stay-filter" className="grid scroll-mt-5 gap-4 border-y border-[var(--border)] py-6">
            <h2 className="text-xl font-bold">Даты и стоимость проживания</h2>
            <PublicStayFilter publicBaseHref={currentPath} filters={context.filters} variant="inline" submitLabel="Рассчитать стоимость" />
            {room.isAvailableForFilter ? <>
              <strong className="text-2xl">{context.filters.hasDates && room.totalPrice != null ? `${formatRubles(Math.round(room.totalPrice))} за ${room.nights} ${getRussianPluralForm(room.nights ?? 0, ["ночь", "ночи", "ночей"])}` : `от ${formatRubles(Math.round(room.displayPricePerNight ?? room.pricePerNight))} / ночь`}</strong>
              <ButtonLink href={buildPublicRequestHref(context.base, room.id, context.filters, property?.slug)} className="min-h-11 w-full sm:w-fit">Оставить заявку</ButtonLink>
            </> : <><InlineNotice tone="warning">{room.unavailableReason || "Номер не подходит по выбранным параметрам"}</InlineNotice><ButtonLink href="#stay-filter" variant="secondary" className="min-h-11 w-full sm:w-fit">Изменить параметры</ButtonLink></>}
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">Заявка не подтверждает проживание — с вами свяжутся для уточнения доступности.</p>
          </section>
          {property ? <section className="grid gap-4"><h2 className="text-xl font-bold">Об объекте</h2><Link href={backHref} className="w-fit font-semibold text-[var(--accent)] underline underline-offset-4">{property.shortTitle}</Link><PublicPropertyDetails property={property} showGallery={false} /></section> : null}
        </> : <>
          <PublicPropertyDetails property={property!} />
          <section id="property-rooms" className="grid gap-5 border-t border-[var(--border)] pt-6">
            <h2 className="text-2xl font-bold">{section?.sourceKinds && !section.sourceKinds.includes("property") ? "Номера в этой подборке" : "Номера объекта"}</h2>
            <PublicStayFilter publicBaseHref={currentPath} filters={context.filters} variant="inline" />
            {section!.rooms.length ? <PublicRoomBrowser publicBaseHref={context.base} rooms={section!.rooms} filters={context.filters} showFilter={false} layout="list" /> : <p className="text-sm text-[var(--text-muted)]">Пока нет опубликованных номеров для заявки.</p>}
          </section>
        </>}
        <ContactLinks contact={context.contact} />
      </div>
    </main>;
  }
  return { Page, generateMetadata };
}
