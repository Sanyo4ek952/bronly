import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "aside" | "div";
  children: ReactNode;
};

export function Panel({ as = "section", children, className, ...props }: PanelProps) {
  const Tag = as;

  return (
    <Tag className={cn("br-card", className)} {...props}>
      {children}
    </Tag>
  );
}
