import { notFound } from "next/navigation";

import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { DashboardPageNav } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";
import { OwnerCalendarBrowser } from "@/widgets/owner-calendar-browser/owner-calendar-browser";

type PropertyCalendarPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";

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

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{property.title}</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Ручное управление занятыми датами по каждому номеру.
            </p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="calendar" />
      </section>

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Календарь занятости</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Отмечайте занятые даты без автоматического подтверждения заявок.
            </p>
          </div>
        </div>

        {property.rooms.length ? (
          <OwnerCalendarBrowser
            propertyId={property.id}
            rooms={property.rooms.map((room) => ({
              id: room.id,
              title: room.title,
              pricePerNight: room.pricePerNight,
              busyRanges: room.busyRanges,
            }))}
            serverNotice={notice}
            serverNoticeTone={error ? "error" : "default"}
          />
        ) : (
          <p className="text-sm leading-[1.5] text-[var(--color-muted)]">
            Сначала добавьте номер, затем отмечайте занятые даты.
          </p>
        )}
      </section>
    </section>
  );
}
