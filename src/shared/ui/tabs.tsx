"use client";

import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type TabItem = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
  id?: string;
  panelId?: string;
};

export type TabsProps = {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    return;
  }

  const tabList = event.currentTarget.parentElement;
  const enabledTabs = tabList
    ? Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
    : [];
  const currentIndex = enabledTabs.indexOf(event.currentTarget);

  if (currentIndex < 0 || enabledTabs.length === 0) {
    return;
  }

  event.preventDefault();

  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? enabledTabs.length - 1
      : event.key === "ArrowRight"
        ? (currentIndex + 1) % enabledTabs.length
        : (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;

  enabledTabs[nextIndex]?.focus();
  enabledTabs[nextIndex]?.click();
}

export function Tabs({ items, value, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap gap-1.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-1",
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.value}
          id={item.id}
          type="button"
          role="tab"
          aria-controls={item.panelId}
          aria-selected={value === item.value}
          tabIndex={value === item.value ? 0 : -1}
          disabled={item.disabled}
          className={cn(
            "min-h-[34px] rounded-[var(--radius-md)] border border-transparent px-3 text-xs font-bold text-[var(--text-muted)]",
            "transition-[background-color,border-color,color,box-shadow] duration-[180ms] hover:bg-[rgb(255_255_255_/_0.66)] hover:text-[var(--text)]",
            "focus-visible:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value === item.value && "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgb(15_23_42_/_0.06)]",
          )}
          onClick={() => onChange?.(item.value)}
          onKeyDown={handleTabKeyDown}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
