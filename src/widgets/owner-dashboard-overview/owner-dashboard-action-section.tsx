import type { ReactNode } from "react";

import { ButtonLink, SectionHeader } from "@/shared/ui";

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
    <section className="br-dashboard-block br-card br-owner-dashboard-action-section">
      <SectionHeader
        title={title}
        description={description}
        actions={actionPlacement === "header" ? actionButton : undefined}
        className="br-dashboard-block__header"
      />

      {children}

      {actionPlacement === "footer" ? <div className="br-owner-actions">{actionButton}</div> : null}
    </section>
  );
}
