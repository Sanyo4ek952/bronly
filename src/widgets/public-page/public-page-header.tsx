import type { ReactNode } from "react";

type PublicPageHeaderProps = {
  children?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
};

export function PublicPageHeader({ children, actions, navigation }: PublicPageHeaderProps) {
  return (
    <header className="br-public-page-header br-card br-card--raised br-card--padding-none">
      <div className="br-public-page-header__top">
        <div className="br-public-page-header__brand">{children}</div>
        {actions ? <div className="br-public-page-header__actions">{actions}</div> : null}
      </div>
      {navigation ? <div className="br-public-page-header__nav">{navigation}</div> : null}
    </header>
  );
}
