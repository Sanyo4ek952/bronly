const DEFAULT_MANUAL_EXTENSION_DAYS = 30;

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateManualExtensionPaidUntil({
  currentPaidUntil,
  now,
  extensionDays = DEFAULT_MANUAL_EXTENSION_DAYS,
}: {
  currentPaidUntil: string | null;
  now: Date;
  extensionDays?: number;
}) {
  if (!Number.isInteger(extensionDays) || extensionDays < 1 || extensionDays > 3650) {
    throw new RangeError("Manual subscription extension must be between 1 and 3650 days.");
  }

  const currentDate = parseDate(currentPaidUntil);
  const baseTimestamp = Math.max(currentDate?.getTime() ?? now.getTime(), now.getTime());
  const nextPaidUntil = new Date(baseTimestamp);
  nextPaidUntil.setUTCDate(nextPaidUntil.getUTCDate() + extensionDays);
  return nextPaidUntil.toISOString();
}

export { DEFAULT_MANUAL_EXTENSION_DAYS };
