import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import type { DashboardBreadcrumbItem } from "@/shared/lib/dashboard-page-nav";

type DashboardPageNavProps = {
  backHref?: string;
  backLabel?: string;
  breadcrumbs: DashboardBreadcrumbItem[];
  compact?: boolean;
};

export function DashboardPageNav({
  backHref,
  backLabel = "Назад",
  breadcrumbs,
  compact = false,
}: DashboardPageNavProps) {
  if (!backHref && !breadcrumbs.length) {
    return null;
  }

  return (
    <div className={cn("grid gap-2.5", compact && "gap-2")}>
      {backHref ? (
        <Link
          href={backHref}
          className={cn(
            "inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--text)] transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
            "hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]",
            "focus-visible:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
            compact && "min-h-9 px-3.5 text-xs",
          )}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{backLabel}</span>
        </Link>
      ) : null}

      {breadcrumbs.length ? (
        <nav
          className="overflow-x-auto pb-1 text-[13px] text-[var(--text-muted)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Хлебные крошки кабинета"
        >
          <ol className="flex min-w-max flex-wrap items-center gap-x-2 gap-y-1.5">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="rounded-md text-[var(--text-muted)] transition-colors duration-[180ms] hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:text-[var(--color-primary-hover)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-semibold text-[var(--text)]")}>
                      {item.label}
                    </span>
                  )}

                  {!isLast ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" /> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
