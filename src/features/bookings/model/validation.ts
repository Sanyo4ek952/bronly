import { areIntervalsOverlapping, parseISO } from "date-fns";
import type { Booking } from "./types";

export function bookingOverlaps(
  candidate: Pick<Booking, "property_id" | "check_in" | "check_out">,
  bookings: Booking[],
  ignoredBookingId?: string,
) {
  return bookings.some((booking) => {
    if (booking.id === ignoredBookingId || booking.property_id !== candidate.property_id) {
      return false;
    }

    return areIntervalsOverlapping(
      { start: parseISO(candidate.check_in), end: parseISO(candidate.check_out) },
      { start: parseISO(booking.check_in), end: parseISO(booking.check_out) },
      { inclusive: false },
    );
  });
}
