import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type StatusPillVariant =
  | "neutral"
  | "pending"
  | "active"
  | "inactive"
  | "new"
  | "accepted_by_owner"
  | "rejected"
  | "transferred_to_owner"
  | "completed";

export type StatusPillProps = {
  children: ReactNode;
  variant: StatusPillVariant;
  className?: string;
};

const variantClassMap: Record<StatusPillVariant, string> = {
  neutral: "bg-[rgb(15_23_42_/_0.06)] text-[var(--text)]",
  pending: "bg-[var(--color-warning-soft)] text-[var(--color-warning-ink)]",
  active: "bg-[rgb(15_159_117_/_0.08)] text-[var(--success)]",
  inactive: "bg-[rgb(196_81_81_/_0.08)] text-[var(--danger)]",
  new: "bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--color-primary-hover)]",
  accepted_by_owner: "bg-[rgb(15_159_117_/_0.08)] text-[var(--success)]",
  rejected: "bg-[rgb(196_81_81_/_0.08)] text-[var(--danger)]",
  transferred_to_owner: "bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--color-primary-hover)]",
  completed: "bg-[rgb(15_159_117_/_0.08)] text-[var(--success)]",
};

export function StatusPill({ children, variant, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center whitespace-nowrap rounded-full border border-transparent px-2 text-[11px] font-bold leading-none",
        variantClassMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
