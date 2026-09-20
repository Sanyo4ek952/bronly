import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type ObjectTabItem = {
  key: string;
  label: string;
  href: string;
};

type ObjectTabsProps = {
  items: ObjectTabItem[];
  active: string;
  appearance?: "pills" | "line";
};

export function ObjectTabs({ items, active, appearance = "pills" }: ObjectTabsProps) {
  return (
    <nav
      className={cn(
        "grid grid-flow-col auto-cols-max overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        appearance === "line" ? "gap-6 border-b border-[var(--border)]" : "gap-3 pb-1",
      )}
      aria-label="Разделы объекта"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-[34px] items-center text-xs font-bold transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
            appearance === "line"
              ? cn(
                  "-mb-px border-b-2 px-0 py-2.5",
                  item.key === active
                    ? "border-[var(--accent)] text-[var(--text)]"
                    : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
                )
              : cn(
                  "rounded-[var(--radius-md)] border px-3",
                  item.key === active
                    ? "border-[rgb(var(--color-primary-rgb)_/_0.30)] bg-[rgb(var(--color-primary-rgb)_/_0.06)] text-[var(--text)] shadow-[0_1px_2px_rgb(15_23_42_/_0.06)]"
                    : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:text-[var(--text)]",
                ),
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
