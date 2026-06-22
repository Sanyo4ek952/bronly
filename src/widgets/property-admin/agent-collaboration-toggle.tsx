"use client";

import { useTransition } from "react";

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
    <label className={`br-property-hub-toggle${checked ? " br-property-hub-toggle--checked" : ""}`}>
      <span className="br-property-hub-toggle__copy">
        <span>Сотрудничество с агентами</span>
        <small>{checked ? "Включено" : "Выключено"}</small>
      </span>
      <span
        className={`br-property-hub-toggle__track${checked ? " br-property-hub-toggle__track--checked" : ""}${isPending ? " br-property-hub-toggle__track--pending" : ""}`}
      >
        <input
          type="checkbox"
          className="br-property-hub-toggle__input"
          checked={checked}
          aria-label="Сотрудничество с агентами"
          disabled={isPending}
          onChange={(event) => handleChange(event.target.checked)}
        />
        <span className="br-property-hub-toggle__thumb" aria-hidden="true" />
      </span>
    </label>
  );
}
