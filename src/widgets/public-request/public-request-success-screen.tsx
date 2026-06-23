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
    <main className="br-auth-page br-auth-page--public">
      <div className="br-public-flow-shell">
        <div className="br-public-flow-shell__header">
          <PublicBrandSlot href={returnHref} />
        </div>
        <Panel className="br-request-success br-card--raised" as="section">
          <div className="br-request-success__icon" aria-hidden="true">
            <AppIcon icon={CircleCheckBig} />
          </div>
          <span className="br-request-success__eyebrow">Заявка отправлена</span>
          <h1>Заявка отправлена</h1>
          <p>{introText}</p>

          {summary ? (
            <section className="br-request-success__summary">
              <div>
                <span>Номер</span>
                <strong>{summary.roomTitle}</strong>
                {summary.propertyTitle ? <small>{summary.propertyTitle}</small> : null}
              </div>
              <div>
                <span>Даты</span>
                <strong>{summary.checkIn && summary.checkOut ? `${summary.checkIn} - ${summary.checkOut}` : "Уточняются"}</strong>
                <small>
                  {summary.guestsLabel} • {summary.roomsLabel}
                </small>
              </div>
              <div>
                <span>Цена</span>
                <strong>{summary.priceLabel}</strong>
                <small>{summary.priceCaption}</small>
              </div>
            </section>
          ) : null}

          <section className="br-request-success__steps">
            <h2>Что дальше</h2>
            <ol>
              {steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="br-request-success__actions">
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
