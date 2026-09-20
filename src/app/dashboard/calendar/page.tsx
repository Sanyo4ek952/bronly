import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerCalendarInventory } from "@/entities/property";
import { ButtonLink, Panel } from "@/shared/ui";
import { OwnerDashboardCalendar } from "@/widgets/owner-dashboard-calendar/owner-dashboard-calendar";

type OwnerCalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerCalendarPage({ searchParams }: OwnerCalendarPageProps) {
  const groups = await getOwnerCalendarInventory();
  const totalRooms = groups.reduce((sum, group) => sum + group.rooms.length, 0);
  const fallbackSearchParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackSearchParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getCalendarNotice(error, success);

  return (
    <section className="grid min-w-0 gap-5 max-[640px]:gap-4">
      <header className="grid gap-1.5 px-1 pt-1 max-[640px]:px-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Управление занятостью</p>
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--text)]">Календарь занятости</h1>
        <p className="max-w-[48rem] text-sm leading-[1.55] text-[var(--text-muted)]">
          Смотрите цены и занятые даты по всем размещениям. Нажмите свободный день, чтобы отметить период.
        </p>
      </header>

      {totalRooms ? (
        <OwnerDashboardCalendar groups={groups} serverNotice={notice} serverNoticeTone={error ? "error" : "default"} />
      ) : (
        <Panel className="grid justify-items-start gap-3 p-5 max-[640px]:p-4" surface="raised">
          <strong className="text-lg text-[var(--text)]">Пока нет номеров для календаря</strong>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Сначала добавьте объект с номерами или создайте отдельный номер, затем отмечайте занятые даты.</p>
          <div className="flex flex-wrap gap-2.5"><ButtonLink href="/dashboard/properties/new">Добавить объект</ButtonLink><ButtonLink href="/dashboard/rooms/new" variant="secondary">Создать отдельный номер</ButtonLink></div>
        </Panel>
      )}
    </section>
  );
}
