import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  notice?: ReactNode;
  compact?: boolean;
};

export function AdminPageHeader({ title, description, actions, notice, compact = false }: AdminPageHeaderProps) {
  return (
    <section className={`br-admin-page-header-card br-card${compact ? " br-admin-page-header-card--compact" : ""}`}>
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
