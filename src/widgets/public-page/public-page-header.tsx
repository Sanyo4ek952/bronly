import type { ReactNode } from "react";

type PublicPageHeaderProps = {
  children?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
};

export function PublicPageHeader({ children, actions, navigation }: PublicPageHeaderProps) {
  return (
    <header className="br-header br-header--public">
      {children}
      {navigation}
      {actions}
    </header>
  );
}
