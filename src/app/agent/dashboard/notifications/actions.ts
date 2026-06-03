"use server";

import { revalidatePath } from "next/cache";

import { markAllNotificationsRead, markNotificationRead } from "@/entities/notification";

function getNotificationId(formData: FormData) {
  const value = formData.get("notificationId");
  return typeof value === "string" ? value : "";
}

export async function markAgentNotificationReadAction(formData: FormData) {
  const result = await markNotificationRead(getNotificationId(formData));

  if (result.ok) {
    revalidatePath("/agent/dashboard", "layout");
    revalidatePath("/agent/dashboard/notifications");
  }
}

export async function markAllAgentNotificationsReadAction(_formData: FormData) {
  const result = await markAllNotificationsRead();

  if (result.ok) {
    revalidatePath("/agent/dashboard", "layout");
    revalidatePath("/agent/dashboard/notifications");
  }
}
