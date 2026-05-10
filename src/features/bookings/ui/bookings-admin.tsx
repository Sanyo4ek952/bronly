"use client";

import { Filter, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { Property } from "@/entities/property/model/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NativeSelect } from "@/shared/ui/native-select";
import { Skeleton } from "@/shared/ui/skeleton";
import { bookingStatuses } from "../model/status";
import type { Booking, BookingFormValues, BookingStatus } from "../model/types";
import { useBookings } from "../api/use-bookings";
import { BookingForm } from "./booking-form";
import { BookingsTable } from "./bookings-table";

type PropertyFilter = "all" | string;
type StatusFilter = "all" | BookingStatus;

type BookingsAdminProps = {
  initialBookings: Booking[];
  properties: Property[];
};

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function BookingsAdmin({ initialBookings, properties }: BookingsAdminProps) {
  const { bookings, create, error, isError, isFetching, isLoading, refetch, remove, update } = useBookings(initialBookings);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const propertyMatches = propertyFilter === "all" || booking.property_id === propertyFilter;
        const statusMatches = statusFilter === "all" || booking.status === statusFilter;

        return propertyMatches && statusMatches;
      }),
    [bookings, propertyFilter, statusFilter],
  );

  const totalAmount = bookings.reduce((sum, booking) => sum + Number(booking.amount), 0);
  const activeBookings = bookings.filter((booking) => booking.status !== "checked_out").length;

  const handleSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (editingBooking) {
        await update(editingBooking.id, values);
        setEditingBooking(null);
        setMessage("Бронь обновлена.");
      } else {
        await create(values);
        setFormVersion((version) => version + 1);
        setMessage("Бронь создана.");
      }
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "Не удалось сохранить бронь.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (booking: Booking) => {
    const confirmed = window.confirm(`Удалить бронь гостя ${booking.guest_name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await remove(booking.id);
      if (editingBooking?.id === booking.id) {
        setEditingBooking(null);
      }
      setMessage("Бронь удалена.");
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Не удалось удалить бронь.");
    }
  };

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-sage-700">Личный кабинет</p>
          <h1 className="mt-2 text-3xl font-semibold text-graphite-900 sm:text-5xl">Управление бронями</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-graphite-500">
            Добавляйте заезды, меняйте статусы и контролируйте пересечения по своим объектам.
          </p>
        </div>
        <Button variant="secondary" onClick={refetch} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-graphite-500">Всего броней</div>
          <div className="mt-2 text-3xl font-semibold text-graphite-900">{bookings.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-graphite-500">Активные</div>
          <div className="mt-2 text-3xl font-semibold text-graphite-900">{activeBookings}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-graphite-500">Сумма</div>
          <div className="mt-2 text-3xl font-semibold text-graphite-900">{currencyFormatter.format(totalAmount)}</div>
        </Card>
      </section>

      {(isError || message) && (
        <Card className="p-4 text-sm text-graphite-700">
          {isError ? error?.message ?? "Не удалось загрузить брони." : message}
        </Card>
      )}

      <BookingForm
        key={`${editingBooking?.id ?? "new"}-${formVersion}`}
        bookings={bookings}
        editingBooking={editingBooking}
        isSubmitting={isSubmitting}
        onCancelEdit={() => setEditingBooking(null)}
        onSubmit={handleSubmit}
        properties={properties}
      />

      <section className="grid gap-4">
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
              <Filter className="h-4 w-4 text-sage-700" />
              Фильтры
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:w-[460px]">
              <NativeSelect value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
                <option value="all">Все объекты</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>{property.title}</option>
                ))}
              </NativeSelect>
              <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="all">Все статусы</option>
                {bookingStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <BookingsTable bookings={filteredBookings} onEdit={setEditingBooking} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
