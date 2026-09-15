import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type SectionTitleProps<T extends ElementType = "h2"> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className"> & {
    className?: string;
  };

export function SectionTitle<T extends ElementType = "h2">({
  as,
  children,
  className,
  ...props
}: SectionTitleProps<T>) {
  const Component = as ?? "h2";

  return (
    <Component
      className={cn("text-[var(--section-title-size)] leading-[1.12] tracking-[-0.03em]", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
