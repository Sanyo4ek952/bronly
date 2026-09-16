import { Inbox } from "lucide-react";

import {
  acceptOwnerRequestAction,
  completeOwnerRequestAction,
  rejectOwnerRequestAction,
} from "@/app/dashboard/requests/actions";
import { getOwnerRequests } from "@/entities/request";
import { InlineNotice } from "@/shared/ui";
import { RequestsBrowser } from "@/widgets/requests-browser";

function formatRequestsCount(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) return `${count} заявок всего`;
  if (mod10 === 1) return `${count} заявка всего`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} заявки всего`;
  return `${count} заявок всего`;
}

function RequestsPageHeader({ count }: { count: number | null }) {
  const [value, ...labelParts] = count === null
    ? ["—", "данные", "недоступны"]
    : formatRequestsCount(count).split(" ");

  return (
    <header className="flex items-end justify-between gap-7 max-[720px]:items-start max-[390px]:grid max-[390px]:gap-4">
      <div>
        <p className="mb-1.5 text-[11px] font-extrabold tracking-[0.11em] text-[var(--accent-strong)]">
          ЗАПРОСЫ НА ПРОЖИВАНИЕ
        </p>
        <h1 className="text-[clamp(32px,3.5vw,46px)] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--text)] max-[520px]:text-[30px]">
          Заявки
        </h1>
        <p className="mt-2.5 max-w-[650px] text-sm leading-[1.55] text-[var(--text-muted)]">
          Следите за запросами гостей, уточняйте детали и вручную обновляйте статус.
        </p>
      </div>

      <div className="grid min-w-[118px] shrink-0 border-l border-[var(--border)] pl-6 max-[520px]:min-w-[92px] max-[520px]:pl-4 max-[390px]:flex max-[390px]:min-w-0 max-[390px]:items-baseline max-[390px]:gap-2 max-[390px]:border-0 max-[390px]:pl-0">
        <strong className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--text)] max-[520px]:text-[27px]">
          {value}
        </strong>
        <span className="mt-1.5 text-[11px] text-[var(--text-muted)] max-[390px]:mt-0">
          {labelParts.join(" ")}
        </span>
      </div>
    </header>
  );
}

export default async function RequestsPage() {
  const requests = await getOwnerRequests();

  return (
    <div className="grid gap-6 max-[720px]:gap-5">
      <RequestsPageHeader count={requests?.length ?? null} />

      {!requests ? (
        <InlineNotice title="Не удалось загрузить заявки" tone="warning" aria-live="polite">
          Данные временно недоступны. Попробуйте обновить страницу позже.
        </InlineNotice>
      ) : null}

      {requests && requests.length === 0 ? (
        <section className="grid justify-items-start gap-[14px] rounded-[22px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="grid size-14 place-items-center rounded-[18px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true">
            <Inbox className="size-7" strokeWidth={2} />
          </div>
          <div className="grid gap-2">
            <h2 className="text-xl font-bold leading-tight text-[var(--text)]">Пока нет заявок</h2>
            <p className="max-w-2xl text-sm leading-[1.55] text-[var(--text-muted)]">
              Новые запросы на проживание появятся здесь после отправки гостем.
            </p>
          </div>
        </section>
      ) : null}

      {requests && requests.length > 0 ? (
        <RequestsBrowser
          requests={requests}
          acceptAction={acceptOwnerRequestAction}
          rejectAction={rejectOwnerRequestAction}
          completeAction={completeOwnerRequestAction}
        />
      ) : null}
    </div>
  );
}
