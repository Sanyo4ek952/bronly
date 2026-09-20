import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room/api/owner-room-detail";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice, StatusPill } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type StandaloneRoomSettingsPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";

export default async function StandaloneRoomSettingsPage({ params, searchParams }: StandaloneRoomSettingsPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);
  const roomViewHref = `/dashboard/rooms/${room.id}`;
  const redirectTo = `/dashboard/rooms/${room.id}/settings`;

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref={roomViewHref}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: room.title, href: roomViewHref },
          { label: "Настройки" },
        ])}
        compact
      />

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Отдельный номер</p>
          <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Опубликован" : "В архиве"}</StatusPill>
        </div>
        <AdminPageHeader
          variant="plain"
          title="Настройки номера"
          description={room.title}
          actions={<ButtonLink href={roomViewHref} variant="secondary">К странице номера</ButtonLink>}
        />
      </div>

      {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}

      <RoomSettingsEditor room={room} redirectTo={redirectTo} />
    </section>
  );
}
