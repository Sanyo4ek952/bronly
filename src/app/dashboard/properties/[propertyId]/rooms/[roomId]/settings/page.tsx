import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice } from "@/shared/ui";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type PropertyRoomSettingsPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";

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

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-1.5">
            <p className="text-sm leading-[1.5] text-[var(--color-muted)]">{property.title}</p>
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Настройки номера</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Здесь можно обновить данные номера, сезонные цены и фотографии.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">
              К списку номеров
            </ButtonLink>
          </div>
        </div>

        {notice ? <InlineNotice>{notice}</InlineNotice> : null}
      </section>

      <RoomSettingsEditor propertyId={property.id} room={room} redirectTo={redirectTo} />
    </section>
  );
}
