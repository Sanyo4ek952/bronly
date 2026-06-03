"use server";

import { redirect } from "next/navigation";

import { getAgentRequestContext } from "@/entities/collaboration";
import { createGuestRequest } from "@/entities/request";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildRequestPath(agentSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/a/${agentSlug}/request${query ? `?${query}` : ""}`;
}

export async function submitAgentGuestRequestAction(formData: FormData) {
  const guestName = getString(formData, "guestName");
  const guestPhone = getString(formData, "guestPhone");
  const checkIn = getString(formData, "checkIn");
  const checkOut = getString(formData, "checkOut");
  const guestComment = getString(formData, "guestComment");
  const roomId = getString(formData, "roomId");
  const propertySlug = getString(formData, "propertySlug");
  const agentSlug = getString(formData, "agentSlug");
  const adultsCount = Number.parseInt(getString(formData, "adultsCount"), 10) || 1;
  const baseState = {
    propertySlug,
    roomId,
    checkIn,
    checkOut,
    adults: String(adultsCount),
  };

  if (!guestName || !guestPhone || !checkIn || !checkOut || !roomId || !propertySlug || !agentSlug) {
    redirect(buildRequestPath(agentSlug || "agent", { ...baseState, error: "validation" }));
  }

  const requestContext = await getAgentRequestContext(agentSlug, propertySlug, roomId);

  if (!requestContext) {
    redirect(buildRequestPath(agentSlug, { ...baseState, error: "room" }));
  }

  const result = await createGuestRequest({
    propertySlug,
    roomId,
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    adultsCount,
    guestComment,
    source: "agent",
    agentProfileId: requestContext.agentId,
    agentMarkupPercent: requestContext.agentMarkupPercent,
  });

  if (!result.ok) {
    const error =
      result.reason === "room_not_found"
        ? "room"
        : result.reason === "availability_failed"
          ? "availability"
          : result.reason === "room_not_suitable" || result.reason === "validation_failed"
            ? "validation"
            : result.reason === "property_not_found"
              ? "property"
              : result.reason === "subscription_expired"
                ? "subscription"
                : "save";
    redirect(buildRequestPath(agentSlug, { ...baseState, error }));
  }

  redirect(`/a/${agentSlug}/request/success?propertySlug=${encodeURIComponent(propertySlug)}`);
}
