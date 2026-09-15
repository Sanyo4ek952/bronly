import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type InlineNoticeTone = "default" | "soft" | "warning" | "error";

export type InlineNoticeProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  tone?: InlineNoticeTone;
  children: ReactNode;
};

export function InlineNotice({
  title,
  tone = "default",
  children,
  className,
  role,
  ...props
}: InlineNoticeProps) {
  return (
    <section
      className={cn(
        "grid gap-1.5 rounded-[var(--radius-lg)] border px-4 py-[14px] text-sm font-semibold leading-[1.5]",
        tone === "default" && "border-[rgb(15_159_117_/_0.18)] bg-[var(--color-success-soft)] text-[var(--color-success-ink)]",
        tone === "soft" && "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text)]",
        tone === "warning" && "border-[rgb(217_154_43_/_0.24)] bg-[var(--color-warning-soft)] text-[var(--color-warning-ink)]",
        tone === "error" && "border-[rgb(196_81_81_/_0.24)] bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]",
        className,
      )}
      role={role ?? (tone === "error" ? "alert" : undefined)}
      {...props}
    >
      {title ? <strong className="block">{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}
