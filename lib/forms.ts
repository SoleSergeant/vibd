export function formValue(value: FormDataEntryValue | null, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function splitCsv(value: string, maxItems = 20) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().slice(0, 60))
        .filter(Boolean)
    )
  ).slice(0, maxItems);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseBooleanString(value: string) {
  return value === "true";
}

/** Returns `value` if it is one of the enum's members, otherwise `fallback`. */
export function parseEnum<T extends Record<string, string>>(enumObject: T, value: string, fallback: T[keyof T]): T[keyof T] {
  return (Object.values(enumObject) as string[]).includes(value) ? (value as T[keyof T]) : fallback;
}

export function parseIntInRange(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseDateOrDefault(value: string, fallbackDaysFromNow = 14) {
  const parsed = value ? new Date(value) : new Date(NaN);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + fallbackDaysFromNow);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}
