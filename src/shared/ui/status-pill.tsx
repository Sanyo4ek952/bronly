import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type StatusPillVariant =
  | "active"
  | "inactive"
  | "new"
  | "accepted_by_owner"
  | "rejected"
  | "transferred_to_owner"
  | "completed";

type StatusPillProps = {
  children: ReactNode;
  variant: StatusPillVariant;
  className?: string;
};

const variantClassMap: Record<StatusPillVariant, string> = {
  active: "br-status-pill--active",
  inactive: "br-status-pill--inactive",
  new: "br-status-pill--new",
  accepted_by_owner: "br-status-pill--confirmed",
  rejected: "br-status-pill--declined",
  transferred_to_owner: "br-status-pill--progress",
  completed: "br-status-pill--confirmed",
};

export function StatusPill({ children, variant, className }: StatusPillProps) {
  return <span className={cn("br-status-pill", variantClassMap[variant], className)}>{children}</span>;
}
