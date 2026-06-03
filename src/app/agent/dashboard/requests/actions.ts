"use server";

import { revalidatePath } from "next/cache";

import { transferAgentRequestToOwner } from "@/entities/request";

function getRequestId(formData: FormData) {
  const value = formData.get("requestId");
  return typeof value === "string" ? value : "";
}

export async function transferAgentRequestAction(formData: FormData) {
  const result = await transferAgentRequestToOwner({ requestId: getRequestId(formData) });

  if (result.ok) {
    revalidatePath("/agent/dashboard/requests");
    revalidatePath("/agent/dashboard");
    revalidatePath("/dashboard/requests");
  }
}
