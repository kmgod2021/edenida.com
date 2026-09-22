/**
 * Guest-facing links and images accept only https URLs.
 * Structured text is rendered as React text, never as HTML.
 */

export function safeHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
