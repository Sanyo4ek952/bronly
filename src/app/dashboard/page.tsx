import { getBookings } from "@/features/bookings/actions";
import { getProperties } from "@/features/properties/actions";
import { PageShell } from "@/shared/ui/page-shell";
import { StatGrid } from "@/shared/ui/stat-grid";

export default async function DashboardPage() {
  const [bookings, properties] = await Promise.all([
    getBookings(),
    getProperties(),
  ]);
  const activeBookings = bookings.filter((booking) => booking.status !== "checked_out").length;

  return (
    <PageShell
      title="Панель управления"
      description="Краткий обзор ваших объектов и бронирований."
    >
      <StatGrid
        items={[
          { label: "Объекты", value: String(properties.length) },
          { label: "Активные брони", value: String(activeBookings) },
          { label: "Всего броней", value: String(bookings.length) },
        ]}
      />
    </PageShell>
  );
}
