import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  parseTrustedOrigin,
  resolveTrustedSiteOrigin,
} from "@/lib/site-url";

describe("parseTrustedOrigin", () => {
  it("accepts https origins and local http origins", () => {
    expect(parseTrustedOrigin("https://edenida.com")).toBe("https://edenida.com");
    expect(parseTrustedOrigin("https://edenida.com/")).toBe("https://edenida.com");
    expect(parseTrustedOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(parseTrustedOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it("rejects credentials, paths, insecure public hosts, and schemes", () => {
    expect(parseTrustedOrigin("https://user:pass@edenida.com")).toBeNull();
    expect(parseTrustedOrigin("https://edenida.com/auth")).toBeNull();
    expect(parseTrustedOrigin("https://edenida.com?next=/app")).toBeNull();
    expect(parseTrustedOrigin("http://evil.example")).toBeNull();
    expect(parseTrustedOrigin("javascript:alert(1)")).toBeNull();
    expect(parseTrustedOrigin("//evil.example")).toBeNull();
  });
});

describe("resolveTrustedSiteOrigin", () => {
  it("prefers a valid NEXT_PUBLIC_SITE_URL", () => {
    expect(
      resolveTrustedSiteOrigin({
        NEXT_PUBLIC_SITE_URL: "https://app.edenida.com",
        VERCEL_URL: "preview-abc.vercel.app",
        NODE_ENV: "production",
      }),
    ).toBe("https://app.edenida.com");
  });

  it("uses the runtime Vercel host when the configured origin is invalid", () => {
    expect(
      resolveTrustedSiteOrigin({
        NEXT_PUBLIC_SITE_URL: "http://evil.example",
        VERCEL_URL: "edenida-git-preview.vercel.app",
        NODE_ENV: "production",
      }),
    ).toBe("https://edenida-git-preview.vercel.app");
  });

  it("falls back to localhost only in development", () => {
    expect(resolveTrustedSiteOrigin({ NODE_ENV: "development" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveTrustedSiteOrigin({ NODE_ENV: "production" })).toBeNull();
    expect(resolveTrustedSiteOrigin({ NODE_ENV: "test" })).toBeNull();
  });
});

describe("buildAuthCallbackUrl", () => {
  it("points confirmation mail at the callback with an internal next", () => {
    const url = buildAuthCallbackUrl("/app", {
      NEXT_PUBLIC_SITE_URL: "https://app.edenida.com",
      NODE_ENV: "production",
    });

    expect(url).toBe("https://app.edenida.com/auth/callback?next=%2Fapp");
  });

  it("does not place an external next into the email link", () => {
    const url = buildAuthCallbackUrl("https://evil.example", {
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NODE_ENV: "production",
    });

    expect(url).toBe("http://127.0.0.1:3000/auth/callback?next=%2Fapp");
  });
});
