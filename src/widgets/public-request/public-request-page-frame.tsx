import Link from "next/link";
import type { ReactNode } from "react";

import { InlineNotice, Panel } from "@/shared/ui";
import { PublicBrandSlot } from "@/widgets/public-page";

type PublicRequestPageFrameProps = {
  title: string;
  description: string;
  closeHref: string;
  closeLabel?: string;
  warningText?: string | null;
  notice?: ReactNode;
  children: ReactNode;
};

export function PublicRequestPageFrame({
  title,
  description,
  closeHref,
  closeLabel = "Закрыть",
  warningText,
  notice,
  children,
}: PublicRequestPageFrameProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page)] px-[calc(16px+var(--safe-area-right))] py-[calc(28px+var(--safe-area-top))] pb-[calc(32px+var(--safe-area-bottom))] max-[720px]:pt-[calc(18px+var(--safe-area-top))]">
      <div className="grid w-full max-w-[720px] gap-4">
        <div className="flex flex-wrap items-center justify-between gap-[14px] max-[640px]:items-stretch">
          <PublicBrandSlot href={closeHref} />
          <Link href={closeHref} className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.88)] px-[14px] font-bold text-[var(--color-text)] transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)] max-[640px]:w-full max-[640px]:justify-center">
            {closeLabel}
          </Link>
        </div>
        <Panel className="grid w-full gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.99),rgb(248_250_250_/_0.97))] shadow-[var(--shadow-md)]" as="section" surface="raised" padding="lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.875rem,4vw,2.625rem)] font-extrabold leading-[1.06]">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
            </div>
            <Link href={closeHref} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.9)] text-2xl leading-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" aria-label={closeLabel}>
              ×
            </Link>
          </div>

          {warningText ? <InlineNotice tone="warning">{warningText}</InlineNotice> : null}
          {notice}
          {children}
        </Panel>
      </div>
    </main>
  );
}
