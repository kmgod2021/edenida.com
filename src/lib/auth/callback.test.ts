import { describe, expect, it } from "vitest";
import { completeAuthCallback } from "@/lib/auth/callback";

describe("completeAuthCallback", () => {
  it("redirects to a safe next path after a successful exchange", async () => {
    const result = await completeAuthCallback({
      code: "auth-code",
      next: "/app/weddings/new",
      exchangeCodeForSession: async () => ({ error: null }),
    });

    expect(result.redirectPath).toBe("/app/weddings/new");
  });

  it("defaults to /app when next is missing", async () => {
    const result = await completeAuthCallback({
      code: "auth-code",
      next: null,
      exchangeCodeForSession: async () => ({ error: null }),
    });

    expect(result.redirectPath).toBe("/app");
  });

  it("drops an external next after a successful exchange", async () => {
    const result = await completeAuthCallback({
      code: "auth-code",
      next: "https://evil.example/phish",
      exchangeCodeForSession: async () => ({ error: null }),
    });

    expect(result.redirectPath).toBe("/app");
  });

  it("uses the error path when the code is missing", async () => {
    let called = false;
    const result = await completeAuthCallback({
      code: "  ",
      next: "/app",
      exchangeCodeForSession: async () => {
        called = true;
        return { error: null };
      },
    });

    expect(called).toBe(false);
    expect(result.redirectPath).toBe("/auth/error");
  });

  it("uses the error path when exchange fails", async () => {
    const result = await completeAuthCallback({
      code: "bad-code",
      next: "/app",
      exchangeCodeForSession: async () => ({
        error: { message: "provider token sk_live_secret" },
      }),
    });

    expect(result.redirectPath).toBe("/auth/error");
    expect(JSON.stringify(result)).not.toContain("sk_live_secret");
  });

  it("uses the error path when exchange throws", async () => {
    const result = await completeAuthCallback({
      code: "bad-code",
      next: "//evil.example",
      exchangeCodeForSession: async () => {
        throw new Error("network down");
      },
    });

    expect(result.redirectPath).toBe("/auth/error");
  });
});
