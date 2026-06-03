export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function withFallbackSlug(value: string, fallback: string) {
  return slugify(value) || fallback;
}
