import { cn } from "@/shared/lib/cn";

type PropertyStatusBadgeProps = {
  status: "published" | "draft" | "archived";
  label: string;
};

export function PropertyStatusBadge({ status, label }: PropertyStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[30px] flex-none items-center justify-center gap-[7px] self-start whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold",
        status === "published" && "bg-[var(--color-success-soft)] text-[var(--color-success-ink)]",
        status === "draft" && "bg-[var(--color-warning-soft)] text-[var(--color-warning-ink)]",
        status === "archived" && "bg-[var(--surface-subtle)] text-[var(--text-subtle)]",
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-95" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
