"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type ReactNode } from "react";
import type { PublicStayFilters } from "@/entities/room";
import { normalizePublicStayFilters } from "@/entities/room/model/pricing";
import { getRussianPluralForm } from "@/shared/lib";
import { buildPublicStayHref } from "@/shared/lib/public-links";
import { Button, ButtonLink, InlineNotice, Input, Select } from "@/shared/ui";

type PublicStayFilterProps = {
  publicBaseHref: string;
  filters: PublicStayFilters;
  resetHref?: string;
  variant?: "default" | "inline";
  submitLabel?: string;
  mode?: "search" | "room";
  maxGuests?: number;
  children?: ReactNode;
};

export function PublicStayFilter({ publicBaseHref, filters, resetHref, variant = "default", submitLabel = "Подобрать номера", mode = "search", maxGuests, children }: PublicStayFilterProps) {
  const filterId = useId();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(filters);
  const [previousFilters, setPreviousFilters] = useState(filters);
  const inline = variant === "inline";
  const automatic = mode === "room";
  const guestLimit = maxGuests == null ? Math.max(8, filters.adults) : Math.max(1, Math.min(20, Math.floor(maxGuests)));
  const tooManyGuests = automatic && draft.adults > guestLimit;
  const appliedHref = buildPublicStayHref(publicBaseHref, filters);
  const draftHref = buildPublicStayHref(publicBaseHref, { ...draft, rooms: 1 });
  const normalizedDraft = normalizePublicStayFilters(draft);
  const invalidDates = Boolean(draft.checkIn || draft.checkOut) && !normalizedDraft.hasDates;
  const updating = isPending || draftHref !== appliedHref;

  // Synchronize external navigation without replacing edits made during a pending calculation.
  if (filters !== previousFilters) {
    setPreviousFilters(filters);
    if (draft === previousFilters || draftHref === appliedHref) setDraft(filters);
  }

  useEffect(() => {
    if (!automatic || invalidDates || isPending || draftHref === appliedHref) return;
    const timer = window.setTimeout(() => {
      startTransition(() => router.replace(draftHref, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [automatic, invalidDates, isPending, draftHref, appliedHref, router]);

  function updateDraft(patch: Partial<PublicStayFilters>) {
    setDraft((current) => ({ ...current, ...patch, rooms: 1 }));
  }

  return (
    <div className="grid gap-[18px]">
      <form
        key={automatic ? "room" : appliedHref}
        method="get"
        onSubmit={automatic ? (event) => event.preventDefault() : undefined}
        aria-label="Параметры проживания"
        className={automatic
          ? "grid grid-cols-2 items-end gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] [&_input]:min-h-11 [&_input]:min-w-0"
          : inline
          ? "grid grid-cols-2 items-end gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] [&_input]:min-h-11 [&_input]:min-w-0"
          : "grid items-end gap-[14px] rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]"}
      >
        <Input id={`${filterId}-check-in`} name="checkIn" type="date" label="Заезд" className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer" defaultValue={automatic ? undefined : filters.checkIn} value={automatic ? draft.checkIn : undefined} onChange={automatic ? (event) => updateDraft({ checkIn: event.target.value }) : undefined} />
        <Input id={`${filterId}-check-out`} name="checkOut" type="date" label="Выезд" className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer" defaultValue={automatic ? undefined : filters.checkOut} value={automatic ? draft.checkOut : undefined} onChange={automatic ? (event) => updateDraft({ checkOut: event.target.value }) : undefined} />
        <Select
          id={`${filterId}-adults`}
          name="adults"
          label="Гости"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={automatic ? undefined : String(filters.adults)}
          value={automatic ? tooManyGuests ? "" : String(draft.adults) : undefined}
          placeholder="Выберите гостей"
          error={tooManyGuests ? `Максимум ${guestLimit} ${getRussianPluralForm(guestLimit, ["гость", "гостя", "гостей"])}` : undefined}
          onValueChange={automatic ? (value) => updateDraft({ adults: Number(value) }) : undefined}
          options={Array.from({ length: guestLimit }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["гость", "гостя", "гостей"])}` : value };
          })}
        />
        {!automatic ? <Select
          id={`${filterId}-rooms`}
          name="rooms"
          label="Комнаты"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={String(filters.rooms)}
          options={Array.from({ length: Math.max(5, filters.rooms) }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["комната", "комнаты", "комнат"])}` : value };
          })}
        /> : null}
        <div className={automatic ? "flex justify-end" : inline ? "col-span-2 flex items-center gap-3 lg:col-span-1" : "grid gap-2.5"}>
          {!automatic ? <Button type="submit" fullWidth className={inline ? "min-h-11 flex-1 whitespace-nowrap lg:min-w-44" : undefined}>
            {submitLabel}
          </Button> : null}
          {automatic ? <Button type="button" variant="ghost" className="min-h-11 underline underline-offset-4" onClick={() => setDraft(normalizePublicStayFilters({ rooms: 1 }))}>Сбросить</Button> : <ButtonLink href={resetHref ?? publicBaseHref} variant={inline ? "ghost" : "secondary"} fullWidth={!inline} className={inline ? "min-h-11 underline underline-offset-4" : undefined}>
            Сбросить
          </ButtonLink>}
        </div>
      </form>

      {automatic ? <div className="grid gap-4" aria-live="polite" aria-atomic="true" aria-busy={!invalidDates && updating}>
        {invalidDates ? <p className="text-sm text-[var(--text-muted)]">{draft.checkIn && draft.checkOut ? "Дата выезда должна быть позже даты заезда." : "Выберите даты заезда и выезда для расчёта стоимости."}</p>
          : updating ? <p className="text-sm text-[var(--text-muted)]" role="status">Рассчитываем стоимость…</p>
            : children}
      </div> : filters.hasDates && inline ? (
        <p className="text-sm text-[var(--text-muted)]">Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.</p>
      ) : filters.hasDates ? (
        <InlineNotice tone="soft">
          Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.
        </InlineNotice>
      ) : null}
    </div>
  );
}
