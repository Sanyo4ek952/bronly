import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room/api/owner-room-detail";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice } from "@/shared/ui";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type StandaloneRoomSettingsPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";

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

      <section className={sectionCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="text-[clamp(24px,3vw,32px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]">Настройки отдельного номера</h1>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Здесь можно обновить данные номера, сезонные цены и фотографии.</p>
          </div>
          <ButtonLink href={roomViewHref} variant="secondary">К странице номера</ButtonLink>
        </div>
        {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}
      </section>

      <RoomSettingsEditor room={room} redirectTo={redirectTo} />
    </section>
  );
}
