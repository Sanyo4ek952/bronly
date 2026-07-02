import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  notice?: ReactNode;
  compact?: boolean;
  variant?: "card" | "plain";
};

export function AdminPageHeader({
  title,
  description,
  actions,
  notice,
  compact = false,
  variant = "card",
}: AdminPageHeaderProps) {
  if (variant === "plain") {
    return (
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <h1 className="text-[clamp(28px,4vw,38px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]">
            {title}
          </h1>
          {description ? <p className="text-sm leading-[1.55] text-[var(--color-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5",
        "max-[720px]:rounded-[20px] max-[720px]:p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-[14px]">
        <div className="grid min-w-0 gap-2">
          <h1
            className={cn(
              "text-[clamp(28px,4vw,38px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]",
              compact && "text-[clamp(24px,3vw,32px)]",
            )}
          >
            {title}
          </h1>
          {description ? <p className="text-sm leading-[1.55] text-[var(--color-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-[14px]">{actions}</div> : null}
      </div>
      {notice ? <div className="grid gap-2.5">{notice}</div> : null}
    </section>
  );
}
