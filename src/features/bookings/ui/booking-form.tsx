"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type { Property } from "@/entities/property/model/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field, FieldError, Label } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import { dateInputFormat, formatRuDate, todayInputValue } from "@/shared/lib/date";
import { bookingFormSchema } from "../model/schema";
import { bookingStatuses } from "../model/status";
import type { Booking, BookingFormValues } from "../model/types";
import { bookingOverlaps } from "../model/validation";

type BookingFormProps = {
  bookings: Booking[];
  editingBooking?: Booking | null;
  isSubmitting?: boolean;
  onCancelEdit?: () => void;
  onSubmit: (values: BookingFormValues) => Promise<void>;
  properties: Property[];
};

const weekDays = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function getCalendarDays(anchorDate: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
  });
}

function formatDateRange(checkIn: string, checkOut: string) {
  if (checkIn && checkOut) {
    return `${formatRuDate(checkIn)} - ${formatRuDate(checkOut)}`;
  }

  if (checkIn) {
    return `${formatRuDate(checkIn)} - выберите выезд`;
  }

  return "Выберите даты заезда и выезда";
}

export function BookingForm({
  bookings,
  editingBooking,
  isSubmitting,
  onSubmit,
  onCancelEdit,
  properties,
}: BookingFormProps) {
  const firstPropertyId = properties[0]?.id ?? "";
  const initialValues = useMemo<BookingFormValues>(() => {
    if (!editingBooking) {
      return {
        property_id: firstPropertyId,
        guest_name: "",
        phone: "",
        check_in: todayInputValue(),
        check_out: "",
        amount: "",
        status: "reserved",
        comment: "",
      };
    }

    return {
      property_id: editingBooking.property_id,
      guest_name: editingBooking.guest_name,
      phone: editingBooking.phone,
      check_in: editingBooking.check_in,
      check_out: editingBooking.check_out,
      amount: String(editingBooking.amount),
      status: editingBooking.status,
      comment: editingBooking.comment ?? "",
    };
  }, [editingBooking, firstPropertyId]);

  const [values, setValues] = useState<BookingFormValues>(initialValues);
  const [error, setError] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(parseISO(initialValues.check_in || todayInputValue())));
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);

  const updateField = <Key extends keyof BookingFormValues>(key: Key, value: BookingFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const updateDateRange = (selectedDate: Date) => {
    const selectedValue = format(selectedDate, dateInputFormat);

    setValues((current) => {
      if (!current.check_in || current.check_out || selectedValue <= current.check_in) {
        return { ...current, check_in: selectedValue, check_out: "" };
      }

      setIsDatePickerOpen(false);
      return { ...current, check_out: selectedValue };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const parsed = bookingFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте поля формы.");
      return;
    }

    if (
      bookingOverlaps(
        { property_id: values.property_id, check_in: values.check_in, check_out: values.check_out },
        bookings,
        editingBooking?.id,
      )
    ) {
      setError("Эти даты пересекаются с другой бронью выбранного объекта.");
      return;
    }

    await onSubmit(parsed.data);
  };

  if (properties.length === 0) {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        Сначала добавьте объект. После этого здесь можно будет создать бронь.
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-graphite-900">{editingBooking ? "Редактировать бронь" : "Новая бронь"}</h2>
        <p className="mt-1 text-sm text-graphite-500">Проверка пересечений выполняется перед сохранением.</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="property_id">Объект</Label>
            <NativeSelect id="property_id" value={values.property_id} onChange={(event) => updateField("property_id", event.target.value)}>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.title}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <Label htmlFor="status">Статус</Label>
            <NativeSelect id="status" value={values.status} onChange={(event) => updateField("status", event.target.value as BookingFormValues["status"])}>
              {bookingStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <Field className="relative">
          <Label htmlFor="stay_dates">Даты проживания</Label>
          <button
            id="stay_dates"
            type="button"
            className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white px-4 text-left text-sm text-graphite-900 shadow-sm outline-none transition hover:border-sage-600/40 focus:border-sage-600 focus:ring-4 focus:ring-sage-600/10"
            onClick={() => setIsDatePickerOpen((current) => !current)}
          >
            <span className={cn("truncate", !values.check_in && "text-graphite-500/70")}>{formatDateRange(values.check_in, values.check_out)}</span>
            <CalendarDays className="h-4 w-4 shrink-0 text-sage-700" />
          </button>

          {isDatePickerOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-sand-200 bg-white p-3 shadow-xl shadow-graphite-900/10">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Button type="button" variant="secondary" size="icon" onClick={() => setCalendarMonth((date) => addMonths(date, -1))} aria-label="Предыдущий месяц">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold capitalize text-graphite-900">{format(calendarMonth, "LLLL yyyy", { locale: ru })}</div>
                <Button type="button" variant="secondary" size="icon" onClick={() => setCalendarMonth((date) => addMonths(date, 1))} aria-label="Следующий месяц">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-graphite-500">
                {weekDays.map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayValue = format(day, dateInputFormat);
                  const isCheckIn = values.check_in === dayValue;
                  const isCheckOut = values.check_out === dayValue;
                  const isInRange = Boolean(values.check_in && values.check_out && dayValue > values.check_in && dayValue < values.check_out);

                  return (
                    <button
                      key={dayValue}
                      type="button"
                      className={cn(
                        "h-9 rounded-lg text-sm font-medium text-graphite-800 transition hover:bg-sand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600",
                        !isSameMonth(day, calendarMonth) && "text-graphite-400",
                        isInRange && "bg-sage-50 text-sage-900",
                        (isCheckIn || isCheckOut) && "bg-sage-700 text-white hover:bg-sage-700",
                        isSameDay(day, new Date()) && !isCheckIn && !isCheckOut && "ring-1 ring-sage-600/30",
                      )}
                      onClick={() => updateDateRange(day)}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="guest_name">Имя гостя</Label>
            <Input id="guest_name" value={values.guest_name} onChange={(event) => updateField("guest_name", event.target.value)} placeholder="Иван Петров" />
          </Field>
          <Field>
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" value={values.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+7 900 000-00-00" />
          </Field>
        </div>

        <Field>
          <Label htmlFor="amount">Сумма брони</Label>
          <Input id="amount" type="number" min="0" step="100" value={values.amount} onChange={(event) => updateField("amount", event.target.value)} placeholder="35000" />
        </Field>
        <Field>
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" value={values.comment} onChange={(event) => updateField("comment", event.target.value)} placeholder="Детали заезда, пожелания гостя" />
        </Field>

        <FieldError>{error}</FieldError>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Сохранение..." : editingBooking ? "Сохранить изменения" : "Добавить бронь"}
          </Button>
          {editingBooking && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Отменить
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
