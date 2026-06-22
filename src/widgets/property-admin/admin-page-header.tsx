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
      <section className="br-admin-page-header">
        <div className="br-admin-page-header__copy">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="br-admin-page-header__actions">{actions}</div> : null}
      </section>
    );
  }

  return (
    <section className={cn("br-admin-page-header-card br-card", compact && "br-admin-page-header-card--compact")}>
      <div className="br-admin-page-header-card__top">
        <div className="br-admin-page-header-card__copy">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="br-admin-page-header-card__actions">{actions}</div> : null}
      </div>
      {notice ? <div className="br-admin-page-header-card__notice">{notice}</div> : null}
    </section>
  );
}
