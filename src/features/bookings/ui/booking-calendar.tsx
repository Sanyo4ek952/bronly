"use client";

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { Property } from "@/entities/property/model/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatRuDate } from "@/shared/lib/date";
import { formatPrice, statusClassName, statusLabel } from "../model/status";
import type { Booking, BookingStatus } from "../model/types";

type BookingCalendarProps = {
  bookings: Booking[];
  isLoading?: boolean;
  properties: Property[];
};

type TimelineBooking = {
  booking: Booking;
  startsBeforeView: boolean;
  endsAfterView: boolean;
  startColumn: number;
  span: number;
};

const visibleDays = 31;
const visibleDayParts = visibleDays * 2;

const statusBarClassName: Record<BookingStatus, string> = {
  reserved: "border-amber-300 bg-amber-100 text-amber-950 shadow-amber-200/70",
  paid: "border-sage-600/30 bg-sage-100 text-sage-900 shadow-sage-200/80",
  living: "border-blue-300 bg-blue-100 text-blue-950 shadow-blue-200/70",
  checked_out: "border-zinc-300 bg-zinc-100 text-zinc-800 shadow-zinc-200/70",
};

function getVisibleBooking(booking: Booking, viewStart: Date, viewEnd: Date): TimelineBooking | null {
  const checkIn = parseISO(booking.check_in);
  const checkOut = parseISO(booking.check_out);

  if (checkOut < viewStart || checkIn >= viewEnd) {
    return null;
  }

  const startOffset = differenceInCalendarDays(checkIn, viewStart);
  const endOffset = differenceInCalendarDays(checkOut, viewStart);
  const startColumn = Math.max(0, startOffset * 2 + 1);
  const endColumn = Math.min(visibleDayParts, endOffset * 2 + 1);

  return {
    booking,
    startsBeforeView: startOffset < 0,
    endsAfterView: endOffset > visibleDays,
    startColumn,
    span: Math.max(1, endColumn - startColumn),
  };
}

export function BookingCalendar({ bookings, isLoading, properties }: BookingCalendarProps) {
  const [anchorDate, setAnchorDate] = useState(startOfMonth(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const days = useMemo(() => Array.from({ length: visibleDays }, (_, index) => addDays(anchorDate, index)), [anchorDate]);
  const viewEnd = useMemo(() => addDays(anchorDate, visibleDays), [anchorDate]);
  const daysGridColumns = `repeat(${visibleDays}, minmax(24px, 1fr))`;
  const bookingGridColumns = `repeat(${visibleDayParts}, minmax(12px, 1fr))`;

  const bookingsByProperty = useMemo(
    () =>
      properties.map((property, index) => ({
        property,
        shortName: String(index + 1),
        bookings: bookings
          .filter((booking) => booking.property_id === property.id)
          .map((booking) => getVisibleBooking(booking, anchorDate, viewEnd))
          .filter((booking): booking is TimelineBooking => Boolean(booking))
          .sort((a, b) => a.startColumn - b.startColumn),
      })),
    [anchorDate, bookings, properties, viewEnd],
  );

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="mt-6 grid gap-3">
          {properties.map((property) => (
            <Skeleton key={property.id} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        Добавьте первый объект, чтобы увидеть календарь занятости.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-sand-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sand-100 text-sage-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-graphite-900">Календарь занятости</h2>
            <p className="text-sm text-graphite-500">
              {format(days[0], "d MMM", { locale: ru })} - {format(days.at(-1)!, "d MMM yyyy", { locale: ru })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => setAnchorDate((date) => addMonths(date, -1))} aria-label="Предыдущий месяц">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setAnchorDate(startOfMonth(new Date()))} aria-label="Текущий месяц">
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setAnchorDate((date) => addMonths(date, 1))} aria-label="Следующий месяц">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-sand-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-graphite-500">
          <span className="inline-flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5 text-sage-700" />заезд</span>
          <span className="inline-flex items-center gap-1.5"><LogOut className="h-3.5 w-3.5 text-graphite-500" />выезд</span>
        </div>
      </div>

      <div className="booking-calendar-scroll overflow-x-auto">
        <div className="min-w-max p-3 pb-4 sm:w-full sm:p-4">
          <div
            className="booking-calendar-grid grid gap-y-2 sm:gap-y-1.5"
            style={
              {
                "--booking-calendar-columns": `36px repeat(${visibleDays}, minmax(24px, 1fr))`,
                "--booking-calendar-desktop-columns": `minmax(104px, 160px) repeat(${visibleDays}, minmax(24px, 1fr))`,
              } as CSSProperties
            }
          >
            <div className="sticky left-0 z-20 w-9 bg-white shadow-[8px_0_14px_-14px_rgba(32,33,31,0.45)] sm:w-auto" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "grid h-12 place-items-center rounded-lg border border-sand-200 bg-sand-50/70 px-1 text-center text-sm font-semibold leading-none text-graphite-700 sm:h-10 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:bg-transparent sm:text-[10px] sm:font-normal sm:text-graphite-500",
                  isSameDay(day, new Date()) && "border-sage-600/30 bg-sand-100 text-graphite-900 ring-1 ring-sage-600/20 sm:rounded-t-lg sm:font-semibold",
                )}
              >
                <span>{format(day, "d")}</span>
                <span className="text-[10px] font-medium uppercase text-graphite-500 sm:text-[8px]">{format(day, "EEEEE", { locale: ru })}</span>
              </div>
            ))}

            {bookingsByProperty.map(({ property, bookings: propertyBookings, shortName }) => (
              <div key={property.id} className="contents">
                <div className="sticky left-0 z-20 flex min-h-14 w-9 items-center justify-center border-r border-sand-200 bg-white shadow-[8px_0_14px_-14px_rgba(32,33,31,0.45)] sm:min-h-16 sm:w-auto sm:justify-start sm:gap-2 sm:pr-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-sage-600 text-sm font-semibold text-white sm:h-7 sm:w-7 sm:text-xs">
                    {shortName}
                  </span>
                  <div className="hidden min-w-0 sm:block">
                    <div className="truncate text-xs font-semibold text-graphite-900">{property.title}</div>
                    <div className="truncate text-[10px] text-graphite-500">{propertyBookings.length ? `${propertyBookings.length} броней` : "свободно"}</div>
                  </div>
                </div>

                <div className="relative min-h-14 overflow-hidden rounded-lg border border-sand-200 bg-white sm:min-h-16 sm:rounded-md" style={{ gridColumn: `2 / span ${visibleDays}` }}>
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: daysGridColumns }}>
                    {days.map((day) => (
                      <div
                        key={`${property.id}-${day.toISOString()}`}
                        className={cn("h-full border-r border-sand-100 bg-sand-50/40", isSameDay(day, new Date()) && "bg-sand-100/80")}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 px-0.5 sm:px-1" style={{ gridTemplateColumns: bookingGridColumns }}>
                    {propertyBookings.map(({ booking, startsBeforeView, endsAfterView, startColumn, span }) => (
                      <button
                        key={booking.id}
                        type="button"
                        className={cn(
                          "group relative z-10 mx-0.5 flex h-8 min-w-0 items-center gap-1 overflow-hidden border px-1.5 text-left text-[10px] font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage-600 sm:h-9 sm:px-2",
                          startsBeforeView ? "rounded-l-none" : "rounded-l-lg",
                          endsAfterView ? "rounded-r-none" : "rounded-r-lg",
                          statusBarClassName[booking.status],
                        )}
                        style={{ gridColumn: `${startColumn + 1} / span ${span}` }}
                        title={`${booking.guest_name}: ${formatRuDate(booking.check_in)} - ${formatRuDate(booking.check_out)}`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {!startsBeforeView && <LogIn className="hidden h-3 w-3 shrink-0 sm:block" />}
                        <span className="min-w-0 truncate">{booking.guest_name}</span>
                        {!endsAfterView && <LogOut className="hidden h-3 w-3 shrink-0 opacity-80 sm:block" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[460px]">
          {selectedBooking && (
            <>
              <div>
                <DialogTitle className="text-xl">{selectedBooking.guest_name}</DialogTitle>
                <DialogDescription>
                  {formatRuDate(selectedBooking.check_in)} - {formatRuDate(selectedBooking.check_out)}
                </DialogDescription>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-sand-50 p-3">
                  <span className="text-graphite-500">Объект</span>
                  <span className="font-medium text-graphite-900">{selectedBooking.property_title}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-sand-50 p-3">
                  <span className="text-graphite-500">Сумма</span>
                  <span className="font-medium text-graphite-900">{formatPrice(selectedBooking.amount)} ₽</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-sand-50 p-3">
                  <span className="text-graphite-500">Статус</span>
                  <Badge className={statusClassName(selectedBooking.status)}>{statusLabel(selectedBooking.status)}</Badge>
                </div>
                {selectedBooking.comment && <p className="rounded-lg bg-sand-50 p-3 text-graphite-700">{selectedBooking.comment}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
