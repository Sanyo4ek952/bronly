import type { ReactNode } from "react";

import { BrandLogo, Panel } from "@/shared/ui";

const AUTH_CONTEXT = [
  "Прямая публичная ссылка без общего каталога",
  "Объекты, номера и занятость в одном кабинете",
  "Заявки и статусы доступны в личном кабинете",
];

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-[linear-gradient(145deg,var(--color-primary-pale),var(--background)_45%,rgb(250_246_239))] px-3 py-5 sm:px-6 sm:py-8">
      <Panel
        className="grid w-full max-w-[980px] gap-5 overflow-hidden rounded-[24px] border-[rgb(var(--color-primary-rgb)_/_0.14)] bg-[rgb(255_255_255_/_0.96)] p-4 shadow-[var(--shadow-lg)] sm:gap-7 sm:rounded-[28px] sm:p-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:gap-10 lg:p-10"
        surface="raised"
      >
        <div className="grid content-start gap-5 sm:gap-7">
          <BrandLogo className="justify-self-start" />
          <div className="grid gap-3 sm:gap-4 lg:pt-8">
            <span className="inline-flex min-h-8 w-fit items-center rounded-full border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">
              {eyebrow}
            </span>
            <h1 className="max-w-[12ch] text-[clamp(32px,5vw,50px)] font-bold leading-[0.98] tracking-[-0.045em] text-[var(--text)]">
              {title}
            </h1>
            <p className="max-w-[38rem] text-[15px] leading-[1.65] text-[var(--text-muted)]">
              {description}
            </p>
          </div>

          <div className="hidden gap-3 border-t border-[var(--border)] pt-6 lg:grid">
            {AUTH_CONTEXT.map((item) => (
              <div
                key={item}
                className="grid grid-cols-[9px_minmax(0,1fr)] items-center gap-3 text-[13px] leading-[1.45] text-[var(--text-muted)]"
              >
                <span className="size-[9px] rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:rounded-[22px] sm:p-6">
          {children}
          <p className="text-center text-sm leading-[1.5] text-[var(--text-muted)] [&_a]:font-bold [&_a]:text-[var(--color-primary-hover)] [&_a]:underline-offset-4 hover:[&_a]:underline">
            {footer}
          </p>
        </div>
      </Panel>
    </main>
  );
}
