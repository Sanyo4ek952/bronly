"use client";

import { useTransition } from "react";

import { cn } from "@/shared/lib/cn";

import { toggleOwnerInventoryAgentInquiries } from "@/app/dashboard/properties/actions";

type AgentCollaborationToggleProps = {
  targetId: string;
  targetKind: "property" | "standalone_room";
  checked: boolean;
};

export function AgentCollaborationToggle({
  targetId,
  targetKind,
  checked,
}: AgentCollaborationToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextChecked: boolean) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetId", targetId);
      formData.set("targetKind", targetKind);

      if (nextChecked) {
        formData.set("allowAgentInquiries", "on");
      }

      await toggleOwnerInventoryAgentInquiries(formData);
    });
  }

  return (
    <label className="inline-flex flex-none items-center justify-end gap-2 whitespace-nowrap max-[960px]:justify-between max-[520px]:w-full">
      <span className="inline-flex items-center text-right max-[960px]:text-left">
        <span className="text-[11px] font-medium leading-[1.1] text-[rgb(16_24_40_/_0.56)] max-[520px]:text-xs">
          Сотрудничество с агентами
        </span>
        <small className="hidden">{checked ? "Включено" : "Выключено"}</small>
      </span>

      <span
        className={cn(
          "relative inline-flex h-6 w-[42px] flex-none items-center rounded-full bg-[rgb(16_24_40_/_0.16)] p-[2px] transition-[background-color,opacity] duration-[180ms]",
          checked && "bg-[var(--color-primary)]",
          isPending && "opacity-80",
        )}
      >
        <input
          type="checkbox"
          className="absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          checked={checked}
          aria-label="Сотрудничество с агентами"
          disabled={isPending}
          onChange={(event) => handleChange(event.target.checked)}
        />
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white [box-shadow:0_2px_6px_rgb(16_24_40_/_0.18)] transition-transform duration-[180ms]",
            checked && "translate-x-[18px]",
          )}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
