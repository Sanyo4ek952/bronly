export function buildOwnerPublicPath(slug?: string | null) {
  return slug ? `/p/${slug}` : null;
}
