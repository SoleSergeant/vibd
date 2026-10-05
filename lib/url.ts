const SAFE_DATA_URL = /^data:(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain|application\/zip|application\/vnd\.openxmlformats-officedocument\.[a-z.]+|application\/msword);base64,/i;

/** Only http(s) links typed by users are stored. */
export function sanitizeUserUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Guards rendering: http(s) links and uploaded files of safe types only. Blocks javascript:, data:text/html, etc. */
export function safeHref(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("data:")) return SAFE_DATA_URL.test(value) ? value : null;
  return sanitizeUserUrl(value);
}

export function isDataUrl(value: string) {
  return value.startsWith("data:");
}
