"use server";

import { revalidatePath } from "next/cache";

import { ensureAgentSubscriptionMutationAllowed } from "@/app/agent/dashboard/subscription-guard";
import { submitAgentProposal } from "@/entities/collaboration";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitAgentProposalAction(formData: FormData) {
  await ensureAgentSubscriptionMutationAllowed("/agent/dashboard/opportunities");

  const result = await submitAgentProposal({
    targetType: (getString(formData, "targetType") || "property") as "property" | "standalone_room",
    propertyId: getString(formData, "propertyId") || undefined,
    roomId: getString(formData, "roomId") || undefined,
    message: getString(formData, "message"),
  });

  if (result.ok) {
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
    revalidatePath("/dashboard/agent-proposals");
  }
}
