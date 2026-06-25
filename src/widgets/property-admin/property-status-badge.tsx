import { cn } from "@/shared/lib/cn";

type PropertyStatusBadgeProps = {
  status: "published" | "draft" | "archived";
  label: string;
};

export function PropertyStatusBadge({ status, label }: PropertyStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[34px] flex-none items-center justify-center gap-[7px] self-start whitespace-nowrap rounded-full px-3 text-xs font-bold",
        status === "published" && "bg-[#eaf7ee] text-[#15803d]",
        status === "draft" && "bg-[#fff7e6] text-[#b54708]",
        status === "archived" && "bg-[rgb(16_24_40_/_0.08)] text-[var(--text-subtle)]",
        "max-[520px]:min-h-[30px] max-[520px]:px-2.5",
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-95" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
