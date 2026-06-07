import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function SectionHeader({ title, description, actions, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("br-section-header", className)} {...props}>
      <div className="br-section-header__copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="br-section-header__actions">{actions}</div> : null}
    </div>
  );
}
