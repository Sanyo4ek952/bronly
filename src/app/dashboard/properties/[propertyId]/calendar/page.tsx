import { notFound } from "next/navigation";

import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice, Panel } from "@/shared/ui";
import { AdminPageHeader, StatusBadge } from "@/widgets/property-admin";
import { PropertySectionNav } from "@/widgets/property-section-nav";
import { OwnerCalendarBrowser } from "@/widgets/owner-calendar-browser/owner-calendar-browser";

type PropertyCalendarPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-5 max-[720px]:gap-4";

export default async function PropertyCalendarPage({ params, searchParams }: PropertyCalendarPageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getCalendarNotice(error, success);
  const propertyDescription = [property.title, property.propertyType, [property.city, property.address].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Календарь занятости" },
        ])}
        compact
      />

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Объект владельца
          </p>
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
        </div>
        <AdminPageHeader variant="plain" title="Календарь объекта" description={propertyDescription} />
      </div>

      {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}

      <PropertySectionNav propertyId={property.id} active="calendar" appearance="line" />

      <section className="grid min-w-0 gap-3" aria-labelledby="property-calendar-title">
        <h2 id="property-calendar-title" className="sr-only">Календарь занятости</h2>
        <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
          Отмечайте недоступные периоды вручную. Это не подтверждает заявку на проживание автоматически.
        </p>

        {property.rooms.length ? (
          <OwnerCalendarBrowser
            propertyId={property.id}
            rooms={property.rooms.map((room) => ({
              id: room.id,
              title: room.title,
              pricePerNight: room.pricePerNight,
              busyRanges: room.busyRanges,
            }))}
          />
        ) : (
          <Panel
            padding="md"
            surface="subtle"
            className="grid justify-items-center gap-4 text-center max-[520px]:justify-items-stretch"
          >
            <div className="grid max-w-[540px] gap-2">
              <h3 className="text-xl font-semibold leading-[1.15] text-[var(--text)]">Сначала добавьте номер</h3>
              <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
                Календарь занятости появится после создания первого номера этого объекта.
              </p>
            </div>
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`} className="max-[520px]:w-full">
              Добавить номер
            </ButtonLink>
          </Panel>
        )}
      </section>
    </section>
  );
}
