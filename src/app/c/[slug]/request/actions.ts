"use server";

import { redirect } from "next/navigation";

import { getCollectionRequestContext } from "@/entities/collection";
import { createGuestRequest, mapGuestRequestFailureToPublicError } from "@/entities/request";
import { encodePublicPathSegment } from "@/shared/lib/public-links";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildRequestPath(collectionSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return `/c/${encodePublicPathSegment(collectionSlug)}/request${query ? `?${query}` : ""}`;
}

function buildSuccessPath(collectionSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return `/c/${encodePublicPathSegment(collectionSlug)}/request/success${query ? `?${query}` : ""}`;
}

export async function submitCollectionGuestRequestAction(formData: FormData) {
  const guestName = getString(formData, "guestName");
  const guestPhone = getString(formData, "guestPhone");
  const checkIn = getString(formData, "checkIn");
  const checkOut = getString(formData, "checkOut");
  const guestComment = getString(formData, "guestComment");
  const roomId = getString(formData, "roomId");
  const propertySlug = getString(formData, "propertySlug");
  const collectionSlug = getString(formData, "collectionSlug");
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

  if (!guestName || !guestPhone || !checkIn || !checkOut || !roomId || !collectionSlug) {
    redirect(buildRequestPath(collectionSlug || "collection", { ...baseState, error: "validation" }));
  }

  const requestContext = await getCollectionRequestContext(collectionSlug, propertySlug || undefined, roomId);

  if (!requestContext) {
    redirect(buildRequestPath(collectionSlug, { ...baseState, error: "room" }));
  }

  const result = await createGuestRequest({
    publicSlug: collectionSlug,
    propertySlug: requestContext.propertySlug ?? undefined,
    roomId,
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    adultsCount,
    roomsCount,
    guestComment,
    source: "collection",
    collectionId: requestContext.collectionId,
    agentProfileId: requestContext.agentProfileId,
  });

  if (!result.ok) {
    const error = mapGuestRequestFailureToPublicError(result.reason);
    redirect(buildRequestPath(collectionSlug, { ...baseState, error }));
  }

  redirect(buildSuccessPath(collectionSlug, baseState));
}
