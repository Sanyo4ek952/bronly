export type GuestRequestFailureReason =
  | "availability_failed"
  | "property_not_found"
  | "room_not_found"
  | "room_not_suitable"
  | "save_failed"
  | "service_unavailable"
  | "subscription_expired"
  | "validation_failed";

export type PublicRequestErrorCode =
  | "availability"
  | "property"
  | "room"
  | "save"
  | "service"
  | "suitability"
  | "subscription"
  | "validation";

export function mapGuestRequestFailureToPublicError(reason: GuestRequestFailureReason): PublicRequestErrorCode {
  switch (reason) {
    case "room_not_found":
      return "room";
    case "availability_failed":
      return "availability";
    case "room_not_suitable":
      return "suitability";
    case "validation_failed":
      return "validation";
    case "property_not_found":
      return "property";
    case "subscription_expired":
      return "subscription";
    case "service_unavailable":
      return "service";
    default:
      return "save";
  }
}
