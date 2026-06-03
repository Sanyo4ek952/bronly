export function mapActionError(error: { code?: string } | null) {
  if (!error?.code) {
    return "save";
  }

  if (error.code === "23505") {
    return "duplicate";
  }

  if (error.code === "23P01") {
    return "overlap";
  }

  return "save";
}
