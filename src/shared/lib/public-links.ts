export function encodePublicPathSegment(value: string) {
  return encodeURIComponent(value);
}

export function buildOwnerPublicPath(slug?: string | null) {
  return slug ? `/p/${encodePublicPathSegment(slug)}` : null;
}

export function buildAgentPublicPath(agentPublicId?: string | null) {
  return agentPublicId ? `/a/${encodePublicPathSegment(agentPublicId)}` : null;
}

export function buildCollectionPublicPath(slug?: string | null) {
  return slug ? `/c/${encodePublicPathSegment(slug)}` : null;
}
