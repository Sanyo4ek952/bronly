import { BookingCalendar } from "@/features/bookings";
import { getBookings } from "@/features/bookings/actions";
import { getProperties } from "@/features/properties/actions";

export default async function CalendarPage() {
  const [bookings, properties] = await Promise.all([
    getBookings(),
    getProperties(),
  ]);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold text-graphite-900">Календарь занятости</h1>
        <p className="mt-2 text-sm text-graphite-500">
          Здесь отображаются только ваши объекты и созданные вами брони.
        </p>
      </div>
      <BookingCalendar bookings={bookings} properties={properties} />
    </section>
  );
}
