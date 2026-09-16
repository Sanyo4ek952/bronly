import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice, StatusPill } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type PropertyRoomSettingsPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";

export default async function PropertyRoomSettingsPage({ params, searchParams }: PropertyRoomSettingsPageProps) {
  const { propertyId, roomId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const room = property.rooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);
  const redirectTo = `/dashboard/properties/${property.id}/rooms/${room.id}/settings`;

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms/${room.id}`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: room.title, href: `/dashboard/properties/${property.id}/rooms/${room.id}` },
          { label: "Настройки" },
        ])}
        compact
      />

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Номер объекта</p>
          <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Активен" : "Неактивен"}</StatusPill>
        </div>
        <AdminPageHeader
          variant="plain"
          title="Настройки номера"
          description={`${room.title} · ${property.title}`}
          actions={
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}`} variant="secondary">
              К странице номера
            </ButtonLink>
          }
        />
      </div>

      {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}

      <RoomSettingsEditor propertyId={property.id} room={room} redirectTo={redirectTo} />
    </section>
  );
}
