import { cn } from "@/shared/lib/cn";

type ObjectStatItem = {
  label: string;
  value: string;
  tone?: "default" | "accent";
};

type ObjectStatsProps = {
  items: ObjectStatItem[];
  compact?: boolean;
};

export function ObjectStats({ items, compact = false }: ObjectStatsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3 max-[520px]:grid-cols-1", compact && "gap-2.5")}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 rounded-2xl border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.74)] px-[14px] py-3"
        >
          <span className="text-xs leading-[1.4] text-[var(--color-muted)]">{item.label}</span>
          <strong className={cn("text-lg font-semibold leading-[1.1] text-[var(--color-text)]", item.tone === "accent" && "text-[var(--color-primary-hover)]")}>
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
