import type { ReactNode } from "react";

import { ButtonLink, Panel } from "@/shared/ui";

type OwnerDashboardActionSectionProps = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  buttonSize?: "sm" | "md";
  buttonVariant?: "primary" | "secondary";
  actionPlacement?: "header" | "footer";
  children?: ReactNode;
};

export function OwnerDashboardActionSection({
  title,
  description,
  href,
  actionLabel,
  buttonSize = "md",
  buttonVariant = "primary",
  actionPlacement = "footer",
  children,
}: OwnerDashboardActionSectionProps) {
  const actionButton = (
    <ButtonLink href={href} size={buttonSize} variant={buttonVariant}>
      {actionLabel}
    </ButtonLink>
  );

  return (
    <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold leading-[1.15] text-[var(--text)]">{title}</h2>
          <p className="max-w-[52rem] text-sm leading-[1.55] text-[var(--text-muted)]">{description}</p>
        </div>
        {actionPlacement === "header" ? actionButton : null}
      </div>

      {children}

      {actionPlacement === "footer" ? <div className="flex flex-wrap gap-2.5">{actionButton}</div> : null}
    </Panel>
  );
}
