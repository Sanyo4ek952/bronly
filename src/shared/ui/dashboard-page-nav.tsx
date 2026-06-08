import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib";
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
    <div className={cn("br-dashboard-page-nav", compact && "br-dashboard-page-nav--compact")}>
      {backHref ? (
        <Link href={backHref} className="br-dashboard-page-nav__back">
          <ChevronLeft aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      ) : null}

      {breadcrumbs.length ? (
        <nav className="br-dashboard-page-nav__breadcrumbs" aria-label="Хлебные крошки кабинета">
          <ol>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={`${item.label}-${index}`}>
                  {item.href && !isLast ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                  )}

                  {!isLast ? <ChevronRight aria-hidden="true" /> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
