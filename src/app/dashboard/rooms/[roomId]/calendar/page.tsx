import { notFound } from "next/navigation";

import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room/api/owner-room-detail";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav } from "@/shared/ui";
import { OwnerCalendarBrowser } from "@/widgets/owner-calendar-browser/owner-calendar-browser";

type StandaloneRoomCalendarPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";

export default async function StandaloneRoomCalendarPage({ params, searchParams }: StandaloneRoomCalendarPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getCalendarNotice(error, success);
  const roomViewHref = `/dashboard/rooms/${room.id}`;

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref={roomViewHref}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: room.title, href: roomViewHref },
          { label: "Календарь занятости" },
        ])}
        compact
      />

      <section className={sectionCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="text-[clamp(24px,3vw,32px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]">{room.title}</h1>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Ручное управление занятыми датами для отдельного номера.</p>
          </div>
          <ButtonLink href={`/dashboard/rooms/${room.id}/settings`} variant="secondary">Настройки</ButtonLink>
        </div>
      </section>

      <section className={sectionCardClass}>
        <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Календарь занятости</h2>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">Отмечайте занятые даты без автоматического подтверждения заявок.</p>
          </div>

        <OwnerCalendarBrowser
          rooms={[
            {
              id: room.id,
              title: room.title,
              pricePerNight: room.pricePerNight,
              busyRanges: room.busyRanges,
            },
          ]}
          serverNotice={notice}
          serverNoticeTone={error ? "error" : "default"}
        />
      </section>
    </section>
  );
}
