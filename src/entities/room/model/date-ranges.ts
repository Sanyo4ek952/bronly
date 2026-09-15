const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(value: string) {
  if (!DATE_RE.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isValidInclusiveDateRange(startsOn: string, endsOn: string) {
  const start = parseIsoDate(startsOn);
  const end = parseIsoDate(endsOn);
  return Boolean(start && end && start.getTime() <= end.getTime());
}

export function isDateWithinInclusiveRange(date: string, startsOn: string, endsOn: string) {
  return Boolean(parseIsoDate(date) && isValidInclusiveDateRange(startsOn, endsOn) && startsOn <= date && date <= endsOn);
}

export function doInclusiveDateRangesOverlap(
  startsOn: string,
  endsOn: string,
  existingStartsOn: string,
  existingEndsOn: string,
) {
  return (
    isValidInclusiveDateRange(startsOn, endsOn) &&
    isValidInclusiveDateRange(existingStartsOn, existingEndsOn) &&
    startsOn <= existingEndsOn &&
    endsOn >= existingStartsOn
  );
}

export function doesStayOverlapInclusiveDateRange(
  checkIn: string,
  checkOut: string,
  startsOn: string,
  endsOn: string,
) {
  const stayStart = parseIsoDate(checkIn);
  const stayEnd = parseIsoDate(checkOut);

  if (!stayStart || !stayEnd || stayStart.getTime() >= stayEnd.getTime() || !isValidInclusiveDateRange(startsOn, endsOn)) {
    return false;
  }

  return checkIn <= endsOn && checkOut > startsOn;
}
