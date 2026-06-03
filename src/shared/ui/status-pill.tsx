import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type StatusPillVariant = "active" | "inactive" | "new" | "in_progress" | "confirmed" | "declined";

type StatusPillProps = {
  children: ReactNode;
  variant: StatusPillVariant;
  className?: string;
};

const variantClassMap: Record<StatusPillVariant, string> = {
  active: "br-status-pill--active",
  inactive: "br-status-pill--inactive",
  new: "br-status-pill--new",
  in_progress: "br-status-pill--progress",
  confirmed: "br-status-pill--confirmed",
  declined: "br-status-pill--declined",
};

export function StatusPill({ children, variant, className }: StatusPillProps) {
  return <span className={cn("br-status-pill", variantClassMap[variant], className)}>{children}</span>;
}
