import type { ReactNode } from "react";

import { ButtonLink, SectionHeader } from "@/shared/ui";

type OwnerDashboardActionSectionProps = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  buttonSize?: "sm" | "md";
  buttonVariant?: "primary" | "secondary";
  children?: ReactNode;
};

export function OwnerDashboardActionSection({
  title,
  description,
  href,
  actionLabel,
  buttonSize = "md",
  buttonVariant = "primary",
  children,
}: OwnerDashboardActionSectionProps) {
  return (
    <section className="br-dashboard-block br-card">
      <SectionHeader title={title} description={description} className="br-dashboard-block__header" />

      {children}

      <div className="br-owner-actions">
        <ButtonLink href={href} size={buttonSize} variant={buttonVariant}>
          {actionLabel}
        </ButtonLink>
      </div>
    </section>
  );
}
