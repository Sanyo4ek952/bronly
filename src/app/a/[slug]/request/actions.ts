"use server";

import { redirect } from "next/navigation";

import { getAgentRequestContext } from "@/entities/collaboration";
import { createGuestRequest } from "@/entities/request";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildRequestPath(agentPublicId: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/a/${agentPublicId}/request${query ? `?${query}` : ""}`;
}

function buildSuccessPath(agentPublicId: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/a/${agentPublicId}/request/success${query ? `?${query}` : ""}`;
}

export async function submitAgentGuestRequestAction(formData: FormData) {
  const guestName = getString(formData, "guestName");
  const guestPhone = getString(formData, "guestPhone");
  const checkIn = getString(formData, "checkIn");
  const checkOut = getString(formData, "checkOut");
  const guestComment = getString(formData, "guestComment");
  const roomId = getString(formData, "roomId");
  const propertySlug = getString(formData, "propertySlug");
  const agentPublicId = getString(formData, "agentPublicId");
  const adultsCount = Number.parseInt(getString(formData, "adultsCount"), 10) || 1;
  const roomsCount = Number.parseInt(getString(formData, "roomsCount"), 10) || 1;
  const baseState = {
    propertySlug,
    roomId,
    checkIn,
    checkOut,
    adults: String(adultsCount),
    rooms: String(roomsCount),
  };

  if (!guestName || !guestPhone || !checkIn || !checkOut || !roomId || !propertySlug || !agentPublicId) {
    redirect(buildRequestPath(agentPublicId || "agent", { ...baseState, error: "validation" }));
  }

  const requestContext = await getAgentRequestContext(agentPublicId, propertySlug, roomId);

  if (!requestContext) {
    redirect(buildRequestPath(agentPublicId, { ...baseState, error: "room" }));
  }

  const result = await createGuestRequest({
    propertySlug,
    roomId,
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    adultsCount,
    roomsCount,
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
    redirect(buildRequestPath(agentPublicId, { ...baseState, error }));
  }

  redirect(buildSuccessPath(agentPublicId, baseState));
}
