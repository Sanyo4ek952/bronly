"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { reviewAgentProposal } from "@/entities/collaboration";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

function getProposalId(formData: FormData) {
  const value = formData.get("proposalId");
  return typeof value === "string" ? value : "";
}

function getTargetType(formData: FormData) {
  const value = formData.get("targetType");
  return value === "property" || value === "standalone_room" ? value : null;
}

async function updateProposal(formData: FormData, decision: "active" | "declined") {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.roles.includes("owner")) {
    redirect("/agent/dashboard");
  }

  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

  if (!subscription.isMutationAllowed) {
    redirect("/dashboard/agent-proposals?error=subscription");
  }

  const targetType = getTargetType(formData);

  if (!targetType) {
    redirect("/dashboard/agent-proposals?error=validation");
  }

  const result = await reviewAgentProposal({
    proposalId: getProposalId(formData),
    targetType,
    decision,
  });

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agent-proposals");
    revalidatePath("/agent/dashboard");
    revalidatePath("/agent/dashboard/opportunities");
    revalidatePath("/agent/dashboard/collaborations");
    redirect(`/dashboard/agent-proposals?success=${decision === "active" ? "accepted" : "declined"}`);
  }

  redirect(`/dashboard/agent-proposals?error=${result.reason}`);
}

export async function acceptAgentProposalAction(formData: FormData) {
  return updateProposal(formData, "active");
}

export async function rejectAgentProposalAction(formData: FormData) {
  return updateProposal(formData, "declined");
}
