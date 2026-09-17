"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAgentProfile } from "@/app/agent/dashboard/access-guard";
import { requestAgentCompletion, transferAgentRequestToOwner } from "@/entities/request";

function getRequestId(formData: FormData) {
  const value = formData.get("requestId");
  return typeof value === "string" ? value : "";
}

export async function transferAgentRequestAction(formData: FormData) {
  await requireAgentProfile();

  const result = await transferAgentRequestToOwner({ requestId: getRequestId(formData) });

  if (result.ok) {
    revalidatePath("/agent/dashboard/requests");
    revalidatePath("/agent/dashboard");
    revalidatePath("/dashboard/requests");
    redirect("/agent/dashboard/requests?success=transferred");
  }

  redirect(`/agent/dashboard/requests?error=${result.reason}`);
}

export async function requestAgentCompletionAction(formData: FormData) {
  await requireAgentProfile();

  const result = await requestAgentCompletion({ requestId: getRequestId(formData) });

  if (result.ok) {
    revalidatePath("/agent/dashboard/requests");
    revalidatePath("/agent/dashboard");
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/notifications");
    redirect("/agent/dashboard/requests?success=completion-requested");
  }

  redirect(`/agent/dashboard/requests?error=${result.reason}`);
}
