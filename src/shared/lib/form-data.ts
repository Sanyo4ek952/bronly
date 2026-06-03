export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getNumber(formData: FormData, key: string, fallback = 0) {
  const raw = getString(formData, key).replace(",", ".");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getInteger(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(getString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
