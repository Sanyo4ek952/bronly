"use server";

import { revalidatePath } from "next/cache";

import { submitAgentProposal } from "@/entities/collaboration";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitAgentProposalAction(formData: FormData) {
  const result = await submitAgentProposal({
    propertyId: getString(formData, "propertyId"),
    message: getString(formData, "message"),
  });

  if (result.ok) {
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
    revalidatePath("/dashboard/agent-proposals");
  }
}
