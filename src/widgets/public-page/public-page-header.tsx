import type { ReactNode } from "react";

type PublicPageHeaderProps = {
  children?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
};

export function PublicPageHeader({ children, actions, navigation }: PublicPageHeaderProps) {
  return (
    <header className="mb-[18px] grid overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      <div className="flex flex-wrap items-center justify-between gap-[14px] border-b border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] px-5 py-[18px]">
        <div className="min-w-0">{children}</div>
        {actions ? <div className="flex flex-wrap items-center justify-end gap-[14px] max-[720px]:w-full max-[720px]:[&>*]:w-full">{actions}</div> : null}
      </div>
      {navigation ? <div className="flex flex-wrap items-center justify-between gap-[14px] px-5 pb-4 pt-[14px]">{navigation}</div> : null}
    </header>
  );
}
