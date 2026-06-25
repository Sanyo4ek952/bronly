"use client";

import { AlertCircle } from "lucide-react";

import { inventoryPrimaryButtonClass } from "@/widgets/property-admin/property-inventory-ui";

type PropertiesErrorProps = {
  reset: () => void;
};

export default function PropertiesError({ reset }: PropertiesErrorProps) {
  return (
    <section className="grid gap-4 max-[520px]:gap-3">
      <article className="grid justify-items-start gap-[14px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] px-6 py-6 [box-shadow:var(--shadow-sm)]">
        <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--color-primary-hover)]" aria-hidden="true">
          <AlertCircle className="h-7 w-7" strokeWidth={2} />
        </div>
        <div className="grid gap-2">
          <h1 className="text-xl font-bold leading-[1.15] text-[var(--text)]">Не удалось загрузить объекты</h1>
          <p className="text-[var(--text-muted)]">
            Попробуйте ещё раз. Если ошибка повторится, проверьте подключение и состояние данных.
          </p>
        </div>
        <button type="button" className={inventoryPrimaryButtonClass} onClick={reset}>
          Повторить
        </button>
      </article>
    </section>
  );
}
