import { getBookings } from "@/features/bookings/actions";
import { BookingsAdmin } from "@/features/bookings";
import { getProperties } from "@/features/properties/actions";

export default async function BookingsPage() {
  const [bookings, properties] = await Promise.all([
    getBookings(),
    getProperties(),
  ]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <BookingsAdmin initialBookings={bookings} properties={properties} />
    </section>
  );
}
