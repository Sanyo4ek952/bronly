import { getOwnerCalendarInventory } from "@/entities/property";
import { ButtonLink, InlineNotice, Panel } from "@/shared/ui";
import { OwnerDashboardCalendar } from "@/widgets/owner-dashboard-calendar/owner-dashboard-calendar";

export default async function OwnerCalendarPage() {
  const groups = await getOwnerCalendarInventory();
  const totalRooms = groups.reduce((sum, group) => sum + group.rooms.length, 0);

  return (
    <section className="grid gap-4">
      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <div className="grid gap-1.5">
          <h1 className="text-[clamp(26px,4vw,34px)] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--text)]">Календарь занятости</h1>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Общий календарь кабинета показывает занятость по всем объектам и отдельным номерам владельца.</p>
        </div>

        <InlineNotice tone="soft">
          Пункт <strong>Календарь</strong> теперь открывает календарь кабинета. Для точечного редактирования переходите в календарь конкретного объекта или отдельного номера.
        </InlineNotice>
      </Panel>

      {totalRooms ? (
        <OwnerDashboardCalendar groups={groups} />
      ) : (
        <Panel className="grid justify-items-start gap-3 p-5" surface="raised">
          <strong className="text-lg text-[var(--text)]">Пока нет номеров для календаря</strong>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Сначала добавьте объект с номерами или создайте отдельный номер, затем отмечайте занятые даты.</p>
          <div className="flex flex-wrap gap-2.5"><ButtonLink href="/dashboard/properties/new">Добавить объект</ButtonLink><ButtonLink href="/dashboard/rooms/new" variant="secondary">Создать отдельный номер</ButtonLink></div>
        </Panel>
      )}
    </section>
  );
}
