"use server";

import { redirect } from "next/navigation";

import { createGuestRequest } from "@/entities/request";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildRequestPath(publicSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/p/${publicSlug}/request${query ? `?${query}` : ""}`;
}

function buildSuccessPath(publicSlug: string, state: Record<string, string>) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  return `/p/${publicSlug}/request/success${query ? `?${query}` : ""}`;
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

  if (!guestName || !guestPhone || !checkIn || !checkOut || !roomId || !propertySlug || !publicSlug) {
    redirect(buildRequestPath(publicSlug || "owner", { ...baseState, error: "validation" }));
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
    redirect(buildRequestPath(publicSlug, { ...baseState, error }));
  }

  redirect(buildSuccessPath(publicSlug, baseState));
}
