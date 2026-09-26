const DEFAULT_NEXT_PATH = "/app";

/**
 * Accept only an internal relative path.
 * Absolute, protocol-relative, and scheme-bearing values fall back to `/app`.
 */
export function safeNextPath(
  candidate: string | null | undefined,
  fallback = DEFAULT_NEXT_PATH,
): string {
  if (typeof candidate !== "string") return fallback;

  const value = candidate.trim();
  if (!value || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(value, "http://edenida.internal");
  } catch {
    return fallback;
  }

  if (parsed.origin !== "http://edenida.internal") return fallback;
  if (parsed.username || parsed.password) return fallback;

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;

  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  if (/[\u0000-\u001F\u007F\\]/.test(decoded)) return fallback;
  if (decoded.includes("://")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded.slice(1))) return fallback;

  return path;
}
