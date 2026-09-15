export const AGENT_PUBLIC_ID_PATTERN = /^ag_[a-z0-9]{6}$/;

export function isCanonicalAgentPublicId(value: string | null | undefined) {
  return Boolean(value && AGENT_PUBLIC_ID_PATTERN.test(value));
}

export function normalizeAgentMarkupPercent(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 999.99) {
    return null;
  }

  return Math.round(value * 100) / 100;
}
