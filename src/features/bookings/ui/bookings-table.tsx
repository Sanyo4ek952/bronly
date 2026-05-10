"use client";

import { Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatRuDate } from "@/shared/lib/date";
import { formatPrice, statusClassName, statusLabel } from "../model/status";
import type { Booking } from "../model/types";

type BookingsTableProps = {
  bookings: Booking[];
  onDelete: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
};

export function BookingsTable({ bookings, onEdit, onDelete }: BookingsTableProps) {
  if (bookings.length === 0) {
    return <EmptyState title="Броней не найдено" description="Измените фильтр или добавьте первую бронь через форму." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-sand-200 bg-white shadow-xl shadow-stone-900/7">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-sand-50 text-xs uppercase text-graphite-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Гость</th>
              <th className="px-4 py-3 font-semibold">Объект</th>
              <th className="px-4 py-3 font-semibold">Даты</th>
              <th className="px-4 py-3 font-semibold">Сумма</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold">Комментарий</th>
              <th className="px-4 py-3 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="align-top hover:bg-sand-50/60">
                <td className="px-4 py-4">
                  <div className="font-semibold text-graphite-900">{booking.guest_name}</div>
                  <div className="mt-1 text-xs text-graphite-500">{booking.phone}</div>
                </td>
                <td className="px-4 py-4 text-graphite-700">{booking.property_title}</td>
                <td className="px-4 py-4 text-graphite-700">
                  {formatRuDate(booking.check_in)}
                  <br />
                  <span className="text-graphite-500">{formatRuDate(booking.check_out)}</span>
                </td>
                <td className="px-4 py-4 font-medium text-graphite-900">{formatPrice(booking.amount)} ₽</td>
                <td className="px-4 py-4">
                  <Badge className={statusClassName(booking.status)}>{statusLabel(booking.status)}</Badge>
                </td>
                <td className="max-w-56 px-4 py-4 text-graphite-500">{booking.comment || "Нет"}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="secondary" onClick={() => onEdit(booking)} aria-label="Редактировать">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => onDelete(booking)} aria-label="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
