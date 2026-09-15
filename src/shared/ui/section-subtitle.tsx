import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type SectionSubtitleProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function SectionSubtitle({ children, className, ...props }: SectionSubtitleProps) {
  return (
    <p className={cn("mb-3 max-w-[68ch] text-[13px] leading-[1.55] text-[var(--text-muted)]", className)} {...props}>
      {children}
    </p>
  );
}
