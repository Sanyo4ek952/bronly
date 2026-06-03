"use server";

import { revalidatePath } from "next/cache";

import { transitionOwnerRequestStatus } from "@/entities/request";

async function updateRequest(requestId: string, nextStatus: "accepted_by_owner" | "rejected" | "completed") {
  const result = await transitionOwnerRequestStatus({ requestId, nextStatus });

  if (result.ok) {
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard");
  }
}

function getRequestId(formData: FormData) {
  const value = formData.get("requestId");
  return typeof value === "string" ? value : "";
}

export async function acceptOwnerRequestAction(formData: FormData) {
  return updateRequest(getRequestId(formData), "accepted_by_owner");
}

export async function rejectOwnerRequestAction(formData: FormData) {
  return updateRequest(getRequestId(formData), "rejected");
}

export async function completeOwnerRequestAction(formData: FormData) {
  return updateRequest(getRequestId(formData), "completed");
}
