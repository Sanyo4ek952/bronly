"use server";

import { revalidatePath } from "next/cache";

import { reviewAgentProposal } from "@/entities/collaboration";

function getProposalId(formData: FormData) {
  const value = formData.get("proposalId");
  return typeof value === "string" ? value : "";
}

function getTargetType(formData: FormData) {
  const value = formData.get("targetType");
  return value === "standalone_room" ? "standalone_room" : "property";
}

async function updateProposal(formData: FormData, decision: "active" | "declined") {
  const result = await reviewAgentProposal({
    proposalId: getProposalId(formData),
    targetType: getTargetType(formData),
    decision,
  });

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agent-proposals");
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
  }
}

export async function acceptAgentProposalAction(formData: FormData) {
  return updateProposal(formData, "active");
}

export async function rejectAgentProposalAction(formData: FormData) {
  return updateProposal(formData, "declined");
}
