"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/shared/ui";

type PropertiesErrorProps = {
  reset: () => void;
};

export default function PropertiesError({ reset }: PropertiesErrorProps) {
  return (
    <section className="grid gap-4">
      <article className="grid justify-items-start gap-[14px] rounded-[22px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]" aria-hidden="true">
          <AlertCircle className="h-7 w-7" strokeWidth={2} />
        </div>
        <div className="grid gap-2">
          <h1 className="text-xl font-bold leading-[1.15] text-[var(--text)]">Не удалось загрузить объекты</h1>
          <p className="text-[var(--text-muted)]">
            Попробуйте ещё раз. Если ошибка повторится, проверьте подключение и состояние данных.
          </p>
        </div>
        <Button type="button" onClick={reset}>Повторить</Button>
      </article>
    </section>
  );
}
