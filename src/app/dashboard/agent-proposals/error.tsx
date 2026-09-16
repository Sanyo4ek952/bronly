"use client";

import { AlertCircle } from "lucide-react";

import { AppIcon, Button, Panel } from "@/shared/ui";

type AgentProposalsErrorProps = {
  reset: () => void;
};

export default function AgentProposalsError({ reset }: AgentProposalsErrorProps) {
  return (
    <Panel className="grid justify-items-start gap-[14px] p-6 shadow-[var(--shadow-md)] max-[640px]:p-4" role="alert">
      <div className="grid size-14 place-items-center rounded-[18px] bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]" aria-hidden="true">
        <AppIcon icon={AlertCircle} className="size-7" strokeWidth={2} />
      </div>
      <div className="grid gap-2">
        <h1 className="text-xl font-bold leading-[1.15] text-[var(--text)]">Не удалось загрузить предложения агентов</h1>
        <p className="max-w-2xl text-sm leading-[1.55] text-[var(--text-muted)]">
          Попробуйте ещё раз. Если ошибка повторится, проверьте подключение и состояние данных.
        </p>
      </div>
      <Button type="button" onClick={reset} className="min-h-11 max-[420px]:w-full">
        Повторить
      </Button>
    </Panel>
  );
}
