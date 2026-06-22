import { getOwnerCalendarInventory } from "@/entities/property";
import { SectionSubtitle, SectionTitle } from "@/shared/ui";
import { OwnerDashboardCalendar } from "@/widgets/owner-dashboard-calendar/owner-dashboard-calendar";

export default async function OwnerCalendarPage() {
  const groups = await getOwnerCalendarInventory();
  const totalRooms = groups.reduce((sum, group) => sum + group.rooms.length, 0);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div className="br-section-copy">
            <SectionTitle>Календарь занятости</SectionTitle>
            <SectionSubtitle>Общий календарь кабинета показывает занятость по всем объектам и отдельным номерам владельца.</SectionSubtitle>
          </div>
        </div>

        <div className="br-inline-notice br-inline-notice--soft">
          Пункт <strong>Календарь</strong> теперь открывает календарь кабинета. Для точечного редактирования переходите в календарь конкретного объекта или отдельного номера.
        </div>
      </section>

      {totalRooms ? (
        <OwnerDashboardCalendar groups={groups} />
      ) : (
        <section className="br-dashboard-block br-card">
          <div className="br-empty-state">
            <strong>Пока нет номеров для календаря</strong>
            <p>Сначала добавьте объект с номерами или создайте отдельный номер, затем отмечайте занятые даты.</p>
          </div>
        </section>
      )}
    </section>
  );
}
