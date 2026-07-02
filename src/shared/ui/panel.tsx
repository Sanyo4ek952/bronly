import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type PanelSurface = "default" | "subtle" | "raised";
type PanelPadding = "none" | "sm" | "md" | "lg";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "aside" | "div";
  children: ReactNode;
  surface?: PanelSurface;
  padding?: PanelPadding;
};

function getSurfaceClass(surface: PanelSurface) {
  switch (surface) {
    case "subtle":
      return "bg-[var(--surface-subtle)]";
    case "raised":
      return "bg-[var(--surface)] shadow-[var(--shadow-md)]";
    default:
      return "bg-[var(--surface)]";
  }
}

function getPaddingClass(padding: PanelPadding) {
  switch (padding) {
    case "none":
      return "p-0";
    case "sm":
      return "p-3";
    case "lg":
      return "p-6";
    default:
      return "p-4";
  }
}

export function Panel({
  as = "section",
  children,
  className,
  surface = "default",
  padding = "none",
  ...props
}: PanelProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] text-[var(--text)]",
        getSurfaceClass(surface),
        getPaddingClass(padding),
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
