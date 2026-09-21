"use client";

import { useId } from "react";
import type { PublicStayFilters } from "@/entities/room";
import { getRussianPluralForm } from "@/shared/lib";
import { Button, ButtonLink, InlineNotice, Input, Select } from "@/shared/ui";

type PublicStayFilterProps = {
  publicBaseHref: string;
  filters: PublicStayFilters;
  resetHref?: string;
  variant?: "default" | "inline";
  submitLabel?: string;
};

export function PublicStayFilter({ publicBaseHref, filters, resetHref, variant = "default", submitLabel = "Подобрать номера" }: PublicStayFilterProps) {
  const filterId = useId();
  const inline = variant === "inline";

  return (
    <div className="grid gap-[18px]">
      <form
        key={`${filters.checkIn}:${filters.checkOut}:${filters.adults}:${filters.rooms}`}
        method="get"
        aria-label="Параметры проживания"
        className={inline
          ? "grid grid-cols-2 items-end gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] [&_input]:min-h-11 [&_input]:min-w-0"
          : "grid items-end gap-[14px] rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]"}
      >
        <Input id={`${filterId}-check-in`} name="checkIn" type="date" label="Заезд" defaultValue={filters.checkIn} />
        <Input id={`${filterId}-check-out`} name="checkOut" type="date" label="Выезд" defaultValue={filters.checkOut} />
        <Select
          id={`${filterId}-adults`}
          name="adults"
          label="Гости"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={String(filters.adults)}
          options={Array.from({ length: Math.max(8, filters.adults) }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["гость", "гостя", "гостей"])}` : value };
          })}
        />
        <Select
          id={`${filterId}-rooms`}
          name="rooms"
          label="Комнаты"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={String(filters.rooms)}
          options={Array.from({ length: Math.max(5, filters.rooms) }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["комната", "комнаты", "комнат"])}` : value };
          })}
        />
        <div className={inline ? "col-span-2 flex items-center gap-3 lg:col-span-1" : "grid gap-2.5"}>
          <Button type="submit" fullWidth className={inline ? "min-h-11 flex-1 whitespace-nowrap lg:min-w-44" : undefined}>
            {submitLabel}
          </Button>
          <ButtonLink href={resetHref ?? publicBaseHref} variant={inline ? "ghost" : "secondary"} fullWidth={!inline} className={inline ? "min-h-11 underline underline-offset-4" : undefined}>
            Сбросить
          </ButtonLink>
        </div>
      </form>

      {filters.hasDates && inline ? (
        <p className="text-sm text-[var(--text-muted)]">Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.</p>
      ) : filters.hasDates ? (
        <InlineNotice tone="soft">
          Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.
        </InlineNotice>
      ) : null}
    </div>
  );
}
