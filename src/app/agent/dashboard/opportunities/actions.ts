"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAgentSubscriptionMutationAllowed } from "@/app/agent/dashboard/subscription-guard";
import { submitAgentProposal } from "@/entities/collaboration";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitAgentProposalAction(formData: FormData) {
  await ensureAgentSubscriptionMutationAllowed("/agent/dashboard/opportunities");

  const targetType = getString(formData, "targetType");

  if (targetType !== "property" && targetType !== "standalone_room") {
    redirect("/agent/dashboard/opportunities?error=validation");
  }

  const result = await submitAgentProposal({
    targetType,
    propertyId: getString(formData, "propertyId") || undefined,
    roomId: getString(formData, "roomId") || undefined,
    message: getString(formData, "message"),
  });

  if (result.ok) {
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
    revalidatePath("/dashboard/agent-proposals");
    redirect("/agent/dashboard/opportunities?success=sent");
  }

  redirect(`/agent/dashboard/opportunities?error=${result.reason}`);
}
