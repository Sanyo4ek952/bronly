"use server";

import { revalidatePath } from "next/cache";

import { reviewAgentProposal } from "@/entities/collaboration";

function getProposalId(formData: FormData) {
  const value = formData.get("proposalId");
  return typeof value === "string" ? value : "";
}

async function updateProposal(proposalId: string, decision: "active" | "declined") {
  const result = await reviewAgentProposal({ proposalId, decision });

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agent-proposals");
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
  }
}

export async function acceptAgentProposalAction(formData: FormData) {
  return updateProposal(getProposalId(formData), "active");
}

export async function rejectAgentProposalAction(formData: FormData) {
  return updateProposal(getProposalId(formData), "declined");
}
