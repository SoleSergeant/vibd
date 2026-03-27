type JsonLike = Record<string, unknown> | null;

export async function readJsonResponse(response: Response): Promise<JsonLike> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}
