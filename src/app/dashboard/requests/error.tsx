"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/shared/ui";

type RequestsErrorProps = {
  reset: () => void;
};

export default function RequestsError({ reset }: RequestsErrorProps) {
  return (
    <section className="grid justify-items-start gap-[14px] rounded-[22px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <div className="grid size-14 place-items-center rounded-[18px] bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]" aria-hidden="true">
        <AlertCircle className="size-7" strokeWidth={2} />
      </div>
      <div className="grid gap-2">
        <h1 className="text-xl font-bold leading-[1.15] text-[var(--text)]">Не удалось загрузить заявки</h1>
        <p className="max-w-2xl text-sm leading-[1.55] text-[var(--text-muted)]">
          Попробуйте ещё раз. Если ошибка повторится, проверьте подключение и состояние данных.
        </p>
      </div>
      <Button type="button" onClick={reset}>Повторить</Button>
    </section>
  );
}
