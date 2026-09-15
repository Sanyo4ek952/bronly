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
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="grid min-w-0 gap-1.5">
        <SectionTitle>{title}</SectionTitle>
        {description ? <SectionSubtitle>{description}</SectionSubtitle> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
