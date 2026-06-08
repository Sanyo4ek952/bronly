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
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Календарь занятости" },
        ])}
        compact
      />

      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Ручное управление занятыми датами по каждому номеру.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="calendar" />
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Календарь занятости</h2>
            <p>Отмечайте занятые даты без автоматического подтверждения заявок.</p>
          </div>
        </div>

        {property.rooms.length ? (
          <OwnerCalendarBrowser
            propertyId={property.id}
            rooms={property.rooms.map((room) => ({
              id: room.id,
              title: room.title,
              subtitle: room.subtitle,
              pricePerNight: room.pricePerNight,
              busyRanges: room.busyRanges,
            }))}
            serverNotice={notice}
          />
        ) : (
          <p className="br-owner-muted">Сначала добавьте номер, затем отмечайте занятые даты.</p>
        )}
      </section>
    </section>
  );
}
