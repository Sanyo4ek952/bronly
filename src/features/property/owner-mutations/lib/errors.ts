export function mapActionError(error: { code?: string; message?: string } | null) {
  if (!error?.code) {
    return "save";
  }

  if (error.code === "23505") {
    return "duplicate";
  }

  if (error.code === "23P01") {
    return "overlap";
  }

  if (error.code === "P0001" && error.message?.includes("room_limit_reached")) {
    return "room-limit";
  }

  return "save";
}
