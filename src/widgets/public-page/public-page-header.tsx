import type { ReactNode } from "react";

type PublicPageHeaderProps = {
  children?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
};

export function PublicPageHeader({ children, actions, navigation }: PublicPageHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4 px-1 py-1">
      <div className="min-w-0 shrink-0">{children}</div>
      {navigation ? (
        <div className="flex min-w-0 flex-1 justify-end max-[640px]:order-3 max-[640px]:basis-full">
          {navigation}
        </div>
      ) : null}
      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-3 max-[720px]:w-full max-[720px]:[&>*]:w-full">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
