import { safeNextPath } from "@/lib/auth/safe-next";

export type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_URL?: string;
  NODE_ENV?: string;
};

/**
 * Public origin only: http(s), no credentials, no path/query/hash.
 * Plain HTTP is limited to localhost and 127.0.0.1.
 */
export function parseTrustedOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F\\]/.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.protocol === "http:") {
    const host = url.hostname.toLowerCase();
    if (host !== "localhost" && host !== "127.0.0.1") return null;
  }
  if (url.pathname !== "/" && url.pathname !== "") return null;
  if (url.search || url.hash) return null;

  return url.origin;
}

/**
 * Trusted public site origin for Auth email links.
 * 1. NEXT_PUBLIC_SITE_URL when it is a valid origin
 * 2. https://$VERCEL_URL at runtime
 * 3. http://localhost:3000 only in local development
 *
 * Does not read Host or X-Forwarded-Host.
 */
export function resolveTrustedSiteOrigin(
  env: SiteUrlEnv = process.env,
): string | null {
  const configured = parseTrustedOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  const vercelHost = env.VERCEL_URL?.trim();
  if (vercelHost && !/[\s/\\]/.test(vercelHost) && !vercelHost.includes("://")) {
    const fromVercel = parseTrustedOrigin(`https://${vercelHost}`);
    if (fromVercel) return fromVercel;
  }

  if (env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return null;
}

/** `<origin>/auth/callback?next=<internal path>` */
export function buildAuthCallbackUrl(
  nextPath = "/app",
  env: SiteUrlEnv = process.env,
): string | null {
  const origin = resolveTrustedSiteOrigin(env);
  if (!origin) return null;

  const next = safeNextPath(nextPath);
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}
