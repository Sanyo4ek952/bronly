"use server";

import { revalidatePath } from "next/cache";

import { ensureAgentSubscriptionMutationAllowed } from "@/app/agent/dashboard/subscription-guard";
import { requestAgentCompletion, transferAgentRequestToOwner } from "@/entities/request";

function getRequestId(formData: FormData) {
  const value = formData.get("requestId");
  return typeof value === "string" ? value : "";
}

export async function transferAgentRequestAction(formData: FormData) {
  await ensureAgentSubscriptionMutationAllowed("/agent/dashboard/requests");

  const result = await transferAgentRequestToOwner({ requestId: getRequestId(formData) });

  if (result.ok) {
    revalidatePath("/agent/dashboard/requests");
    revalidatePath("/agent/dashboard");
    revalidatePath("/dashboard/requests");
  }
}

export async function requestAgentCompletionAction(formData: FormData) {
  await ensureAgentSubscriptionMutationAllowed("/agent/dashboard/requests");

  const result = await requestAgentCompletion({ requestId: getRequestId(formData) });

  if (result.ok) {
    revalidatePath("/agent/dashboard/requests");
    revalidatePath("/agent/dashboard");
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/notifications");
  }
}
