"use client";

import { Button, InlineNotice } from "@/shared/ui";

type AdminErrorProps = {
  reset: () => void;
};

export default function AdminError({ reset }: AdminErrorProps) {
  return (
    <section className="grid gap-4">
      <InlineNotice title="Не удалось загрузить данные администратора" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте ещё раз позже.
      </InlineNotice>
      <div>
        <Button type="button" onClick={reset}>
          Повторить
        </Button>
      </div>
    </section>
  );
}
