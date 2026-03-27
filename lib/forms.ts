export function formValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
