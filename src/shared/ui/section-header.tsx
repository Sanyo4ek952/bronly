import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { SectionSubtitle } from "@/shared/ui/section-subtitle";
import { SectionTitle } from "@/shared/ui/section-title";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function SectionHeader({ title, description, actions, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("br-section-header", className)} {...props}>
      <div className="br-section-copy br-section-header__copy">
        <SectionTitle>{title}</SectionTitle>
        {description ? <SectionSubtitle>{description}</SectionSubtitle> : null}
      </div>
      {actions ? <div className="br-section-header__actions">{actions}</div> : null}
    </div>
  );
}
