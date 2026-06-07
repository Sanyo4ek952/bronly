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
      return "br-card--subtle";
    case "raised":
      return "br-card--raised";
    default:
      return "br-card--default";
  }
}

function getPaddingClass(padding: PanelPadding) {
  switch (padding) {
    case "none":
      return "br-card--padding-none";
    case "sm":
      return "br-card--padding-sm";
    case "lg":
      return "br-card--padding-lg";
    default:
      return "br-card--padding-md";
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
    <Tag className={cn("br-card", getSurfaceClass(surface), getPaddingClass(padding), className)} {...props}>
      {children}
    </Tag>
  );
}
