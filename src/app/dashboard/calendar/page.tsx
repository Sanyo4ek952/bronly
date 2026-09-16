import { getOwnerCalendarInventory } from "@/entities/property";
import { ButtonLink, Panel } from "@/shared/ui";
import { OwnerDashboardCalendar } from "@/widgets/owner-dashboard-calendar/owner-dashboard-calendar";

export default async function OwnerCalendarPage() {
  const groups = await getOwnerCalendarInventory();
  const totalRooms = groups.reduce((sum, group) => sum + group.rooms.length, 0);

  return (
    <section className="grid gap-7 max-[640px]:gap-5">
      <header className="grid grid-cols-[minmax(0,1fr)_minmax(220px,310px)] items-end gap-8 px-1 pt-2 max-[760px]:grid-cols-1 max-[760px]:gap-5 max-[640px]:px-0 max-[640px]:pt-0">
        <div>
          <p className="mb-3 text-[11px] font-extrabold tracking-[0.13em] text-[var(--accent-strong)]">КАЛЕНДАРЬ ЗАНЯТОСТИ</p>
          <h1 className="text-[clamp(2.25rem,4.4vw,3.4rem)] font-semibold leading-none tracking-[-0.055em] text-[var(--text)]">Все даты — в одном обзоре</h1>
          <p className="mt-4 max-w-[43rem] text-[15px] leading-[1.65] text-[var(--text-subtle)] max-[640px]:mt-3 max-[640px]:text-sm">
            Проверяйте занятость объектов и отдельных номеров, переключайте месяц и переходите к нужному календарю для точечного редактирования.
          </p>
        </div>
        <p className="border-l-2 border-[var(--accent)] py-1 pl-4 text-[13px] leading-[1.55] text-[var(--text-muted)]">
          <strong className="mb-1 block text-[var(--text)]">Обзор без случайных изменений</strong>
          На этой странице даты доступны для просмотра. Редактирование открывается в календаре объекта или номера.
        </p>
      </header>

      {totalRooms ? (
        <OwnerDashboardCalendar groups={groups} />
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
