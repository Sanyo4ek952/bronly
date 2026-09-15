"use server";

import { redirect } from "next/navigation";

import { createGuestRequest, mapGuestRequestFailureToPublicError } from "@/entities/request";
import { encodePublicPathSegment } from "@/shared/lib/public-links";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(formData: FormData, key: string) {
  const rawValue = getString(formData, key);
  const value = Number(rawValue);

  return Number.isInteger(value) && value > 0 ? value : Number.NaN;
}

function buildRequestPath(publicSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/p/${encodePublicPathSegment(publicSlug)}/request${query ? `?${query}` : ""}`;
}

function buildSuccessPath(publicSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/p/${encodePublicPathSegment(publicSlug)}/request/success${query ? `?${query}` : ""}`;
}

export async function submitGuestRequestAction(formData: FormData) {
  const guestName = getString(formData, "guestName");
  const guestPhone = getString(formData, "guestPhone");
  const checkIn = getString(formData, "checkIn");
  const checkOut = getString(formData, "checkOut");
  const guestComment = getString(formData, "guestComment");
  const roomId = getString(formData, "roomId");
  const publicSlug = getString(formData, "publicSlug");
  const propertySlug = getString(formData, "propertySlug");
  const adultsCount = getPositiveInteger(formData, "adultsCount");
  const roomsCount = getPositiveInteger(formData, "roomsCount");
  const hasPrivacyConsent = getString(formData, "privacyConsent") === "on";
  const baseState = {
    propertySlug,
    roomId,
    checkIn,
    checkOut,
    adults: String(adultsCount),
    rooms: String(roomsCount),
  };

  if (
    !guestName ||
    !guestPhone ||
    !checkIn ||
    !checkOut ||
    !roomId ||
    !publicSlug ||
    !Number.isInteger(adultsCount) ||
    !Number.isInteger(roomsCount) ||
    !hasPrivacyConsent
  ) {
    redirect(buildRequestPath(publicSlug || "owner", { ...baseState, error: "validation" }));
  }

  const result = await createGuestRequest({
    publicSlug,
    propertySlug,
    roomId,
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    adultsCount,
    roomsCount,
    guestComment,
  });

  if (!result.ok) {
    const error = mapGuestRequestFailureToPublicError(result.reason);
    redirect(buildRequestPath(publicSlug, { ...baseState, error }));
  }

  redirect(buildSuccessPath(publicSlug, baseState));
}
