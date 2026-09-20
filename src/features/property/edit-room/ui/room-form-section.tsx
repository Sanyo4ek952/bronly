import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type RoomFormSectionProps = {
  title: string;
  description?: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function RoomFormSection({
  title,
  description,
  summary,
  defaultOpen = false,
  id,
  className,
  children,
}: RoomFormSectionProps) {
  if (summary) {
    return (
      <details
        id={id}
        open={defaultOpen}
        className={cn("group border-t border-[var(--border)] scroll-mt-28", className)}
      >
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-5 marker:hidden max-[640px]:grid-cols-1 [&::-webkit-details-marker]:hidden">
          <span className="grid gap-1.5">
            <span className="text-lg font-semibold leading-[1.2] text-[var(--text)]" role="heading" aria-level={2}>
              {title}
            </span>
            {description ? <span className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--text-muted)]">{description}</span> : null}
          </span>
          <span className="flex min-w-0 items-center justify-end gap-3 max-[640px]:justify-between">
            <span className="max-w-[38ch] text-right text-[13px] font-semibold leading-[1.45] text-[var(--text)] max-[640px]:text-left">
              {summary}
            </span>
            <span
              className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            >
              ▾
            </span>
          </span>
        </summary>
        <div className="grid gap-3 pb-6">{children}</div>
      </details>
    );
  }

  return (
    <section id={id} className={cn("grid gap-4 border-t border-[var(--border)] py-6 scroll-mt-24 max-[640px]:py-5", className)}>
      <div className="grid gap-1.5">
        <h2 className="text-lg font-semibold leading-[1.2] text-[var(--text)]">{title}</h2>
        {description ? <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--text-muted)]">{description}</p> : null}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
