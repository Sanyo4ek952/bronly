function normalizePhoneDigits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function toPhoneHref(value: string) {
  const digits = normalizePhoneDigits(value);
  return digits ? `tel:${digits}` : undefined;
}

export function toMaxHref(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || normalized.length > 2048 || /[\s\\]/.test(normalized)) return undefined;

  try {
    const url = new URL(normalized.startsWith("max.ru/") ? `https://${normalized}` : normalized);
    if (url.protocol !== "https:" || url.hostname !== "max.ru" || url.port || url.username || url.password || !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(url.pathname)) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

export function toTelegramHref(value: string) {
  const normalized = value.replace(/^@/, "").trim();
  return normalized ? `https://t.me/${normalized}` : undefined;
}
