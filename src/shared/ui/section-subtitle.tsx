import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type SectionSubtitleProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function SectionSubtitle({ children, className, ...props }: SectionSubtitleProps) {
  return (
    <p className={cn("br-section-subtitle", className)} {...props}>
      {children}
    </p>
  );
}
