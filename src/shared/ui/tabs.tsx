"use client";

import { cn } from "@/shared/lib/cn";

type TabItem = {
  label: string;
  value: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function Tabs({ items, value, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div className={cn("br-tab-row", className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={cn("br-tab", value === item.value && "br-tab--active")}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
