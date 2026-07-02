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
};

export function ObjectTabs({ items, active }: ObjectTabsProps) {
  return (
    <nav className="grid grid-flow-col auto-cols-max gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Разделы объекта">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "inline-flex min-h-[34px] items-center rounded-[var(--radius-md)] border px-3 text-xs font-bold transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
            item.key === active
              ? "border-[rgb(var(--color-primary-rgb)_/_0.30)] bg-[rgb(var(--color-primary-rgb)_/_0.06)] text-[var(--text)] shadow-[0_1px_2px_rgb(15_23_42_/_0.06)]"
              : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:text-[var(--text)]",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
