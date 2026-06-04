export function buildOwnerPublicPath(slug?: string | null) {
  return slug ? `/p/${slug}` : null;
}

export function buildAgentPublicPath(agentPublicId?: string | null) {
  return agentPublicId ? `/a/${agentPublicId}` : null;
}
