import type { ReactNode } from "react";

type PublicPageHeaderProps = {
  children?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
  variant?: "default" | "minimal";
};

export function PublicPageHeader({ children, actions, navigation, variant = "default" }: PublicPageHeaderProps) {
  const minimal = variant === "minimal";
  return (
    <header className={minimal ? "flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b border-[var(--border)] pb-3" : "mb-5 flex flex-wrap items-center justify-between gap-4 px-1 py-1"}>
      <div className="min-w-0 shrink-0">{children}</div>
      {navigation ? (
        <div className={minimal ? "flex min-w-0 justify-end" : "flex min-w-0 flex-1 justify-end max-[640px]:order-3 max-[640px]:basis-full"}>
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
