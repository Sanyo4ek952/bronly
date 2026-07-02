import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type InlineNoticeProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  tone?: "default" | "soft" | "warning";
  children: ReactNode;
};

export function InlineNotice({
  title,
  tone = "default",
  children,
  className,
  ...props
}: InlineNoticeProps) {
  return (
    <section
      className={cn(
        "grid gap-1.5 rounded-[18px] px-4 py-[14px] text-sm font-semibold leading-[1.5]",
        tone === "default" && "bg-[var(--color-success-soft)] text-[var(--color-success-ink)]",
        tone === "soft" && "bg-[rgb(var(--color-primary-rgb)_/_0.12)] text-[var(--color-primary-hover)]",
        tone === "warning" && "bg-[rgb(217_154_43_/_0.14)] text-[var(--color-warning-ink)]",
        className,
      )}
      {...props}
    >
      {title ? <strong className="block">{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}
