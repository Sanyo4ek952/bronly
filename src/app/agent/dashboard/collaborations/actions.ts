"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAgentProfile } from "@/app/agent/dashboard/access-guard";
import { upsertAgentRoomMarkup } from "@/entities/collaboration";
import { getString } from "@/shared/lib/form-data";

function buildCollaborationsPath(state?: Record<string, string>) {
  const params = new URLSearchParams();

  if (state) {
    for (const [key, value] of Object.entries(state)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();

  return query ? `/agent/dashboard/collaborations?${query}` : "/agent/dashboard/collaborations";
}

export async function saveAgentRoomMarkupAction(formData: FormData) {
  const roomId = getString(formData, "roomId");
  const markupValue = getString(formData, "markupPercent");
  const markupPercent = markupValue ? Number(markupValue) : Number.NaN;

  await requireAgentProfile();

  const result = await upsertAgentRoomMarkup({
    roomId,
    markupPercent,
  });

  if (!result.ok) {
    const error =
      result.reason === "not_allowed"
        ? "not_allowed"
        : result.reason === "validation"
          ? "validation"
          : result.reason === "unauthorized"
            ? "unauthorized"
            : "save_failed";
    redirect(buildCollaborationsPath({ error }));
  }

  revalidatePath("/agent/dashboard");
  revalidatePath("/agent/dashboard/collaborations");
  revalidatePath("/a/[slug]", "page");
  revalidatePath("/c/[slug]", "page");
  redirect(buildCollaborationsPath({ success: "saved" }));
}
