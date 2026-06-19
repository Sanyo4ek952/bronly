import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type SectionSubtitleProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function SectionSubtitle({ children, className, ...props }: SectionSubtitleProps) {
  return (
    <p className={cn("br-section-subtitle mb-10!", className)} {...props}>
      {children}
    </p>
  );
}
