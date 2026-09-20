"use client";

import { useState, useTransition } from "react";

import { cn } from "@/shared/lib/cn";

import { toggleOwnerInventoryAgentInquiries } from "@/features/property/owner-mutations";

type AgentCollaborationToggleProps = {
  targetId: string;
  targetKind: "property" | "standalone_room";
  checked: boolean;
  activeCollaborationsCount?: number;
  itemTitle?: string;
  label?: string;
};

export function AgentCollaborationToggle({
  targetId,
  targetKind,
  checked,
  activeCollaborationsCount = 0,
  itemTitle = "варианта",
  label = "Предложения агентов",
}: AgentCollaborationToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [currentChecked, setCurrentChecked] = useState(checked);

  function handleChange(nextChecked: boolean) {
    const previousChecked = currentChecked;
    setCurrentChecked(nextChecked);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetId", targetId);
      formData.set("targetKind", targetKind);

      if (nextChecked) {
        formData.set("allowAgentInquiries", "on");
      }

      const result = await toggleOwnerInventoryAgentInquiries(formData);

      if (!result.ok) {
        setCurrentChecked(previousChecked);
      }
    });
  }

  return (
    <label className="inline-flex flex-none items-center justify-end gap-2.5 whitespace-nowrap max-[720px]:w-full max-[720px]:justify-between">
      <span className="grid gap-0.5 text-right max-[720px]:text-left">
        <span className="text-[11px] font-semibold leading-[1.1] text-[var(--text-subtle)]">
          {label}
        </span>
        <small className="text-[10px] leading-none text-[var(--text-muted)]">
          {activeCollaborationsCount > 0
            ? `${activeCollaborationsCount} ${activeCollaborationsCount === 1 ? "активное" : "активных"}`
            : currentChecked ? "Открыты" : "Закрыты"}
        </small>
      </span>

      <span
        className={cn(
          "relative inline-flex h-6 w-[42px] flex-none items-center rounded-full bg-[rgb(16_24_40_/_0.16)] p-[2px] transition-[background-color,opacity] duration-[180ms]",
          currentChecked && "bg-[var(--color-primary)]",
          isPending && "opacity-80",
          "has-[:focus-visible]:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
        )}
      >
        <input
          type="checkbox"
          className="absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          checked={currentChecked}
          aria-label={`${label} — ${itemTitle}`}
          disabled={isPending}
          onChange={(event) => handleChange(event.target.checked)}
        />
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white [box-shadow:0_2px_6px_rgb(16_24_40_/_0.18)] transition-transform duration-[180ms]",
            currentChecked && "translate-x-[18px]",
          )}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
