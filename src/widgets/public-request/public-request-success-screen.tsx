import { CircleCheckBig } from "lucide-react";
import type { ReactNode } from "react";

import type { PublicRequestSuccessStep, PublicRequestSummary } from "@/features/request/submit-request/model/public-request-ui";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";
import { PublicBrandSlot } from "@/widgets/public-page";

type PublicRequestSuccessScreenProps = {
  introText: string;
  summary?: PublicRequestSummary | null;
  steps: PublicRequestSuccessStep[];
  returnHref: string;
  returnLabel: string;
  secondaryAction?: ReactNode;
};

export function PublicRequestSuccessScreen({
  introText,
  summary,
  steps,
  returnHref,
  returnLabel,
  secondaryAction,
}: PublicRequestSuccessScreenProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page)] px-[calc(16px+var(--safe-area-right))] py-[calc(28px+var(--safe-area-top))] pb-[calc(32px+var(--safe-area-bottom))] max-[720px]:pt-[calc(18px+var(--safe-area-top))]">
      <div className="grid w-full max-w-[720px] gap-4">
        <div className="flex items-center justify-between gap-[14px]">
          <PublicBrandSlot href={returnHref} />
        </div>
        <Panel className="grid w-full gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.99),rgb(248_250_250_/_0.97))] text-center shadow-[var(--shadow-md)]" as="section" surface="raised" padding="lg">
          <div className="mx-auto grid h-[92px] w-[92px] place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] [&_svg]:h-11 [&_svg]:w-11" aria-hidden="true">
            <AppIcon icon={CircleCheckBig} />
          </div>
          <span className="mx-auto inline-flex min-h-8 items-center justify-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">Заявка отправлена</span>
          <h1 className="text-[clamp(1.875rem,4vw,2.625rem)] font-extrabold leading-[1.06]">Заявка отправлена</h1>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">{introText}</p>

          {summary ? (
            <section className="grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] p-4 text-left sm:grid-cols-2">
              <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                <span className="text-[var(--color-muted)]">Номер</span>
                <strong className="text-xl leading-tight">{summary.roomTitle}</strong>
                {summary.propertyTitle ? <small className="text-[var(--color-muted)]">{summary.propertyTitle}</small> : null}
              </div>
              <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                <span className="text-[var(--color-muted)]">Даты</span>
                <strong className="text-xl leading-tight">{summary.checkIn && summary.checkOut ? `${summary.checkIn} — ${summary.checkOut}` : "Уточняются"}</strong>
                <small className="text-[var(--color-muted)]">
                  {summary.guestsLabel} • {summary.roomsLabel}
                </small>
              </div>
              <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                <span className="text-[var(--color-muted)]">Цена</span>
                <strong className="text-xl leading-tight">{summary.priceLabel}</strong>
                <small className="text-[var(--color-muted)]">{summary.priceCaption}</small>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)] p-4 text-left">
            <h2 className="text-[22px] font-extrabold leading-tight">Что дальше</h2>
            <ol className="grid list-decimal gap-4 pl-6 marker:font-extrabold marker:text-[var(--color-primary-hover)]">
              {steps.map((step) => (
                <li key={step.title}>
                  <strong className="block">{step.title}</strong>
                  <span className="mt-1 block text-sm leading-relaxed text-[var(--color-muted)]">{step.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href={returnHref} fullWidth>
              {returnLabel}
            </ButtonLink>
            {secondaryAction}
          </div>
        </Panel>
      </div>
    </main>
  );
}
