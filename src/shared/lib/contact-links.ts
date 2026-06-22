function normalizePhoneDigits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function toPhoneHref(value: string) {
  const digits = normalizePhoneDigits(value);
  return digits ? `tel:${digits}` : undefined;
}

export function toWhatsAppHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

export function toTelegramHref(value: string) {
  const normalized = value.replace(/^@/, "").trim();
  return normalized ? `https://t.me/${normalized}` : undefined;
}
