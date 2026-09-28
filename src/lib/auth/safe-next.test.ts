import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next";

describe("safeNextPath", () => {
  it("keeps internal paths and defaults to /app", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/weddings/1")).toBe("/app/weddings/1");
    expect(safeNextPath("/login?from=signup")).toBe("/login?from=signup");
  });

  it("rejects absolute, protocol-relative, and scheme URLs", () => {
    expect(safeNextPath("https://evil.example/phish")).toBe("/app");
    expect(safeNextPath("http://evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("///evil.example")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
    expect(safeNextPath("/javascript:alert(1)")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)//")).toBe("/app");
  });

  it("rejects backslash, encoded protocol-relative, and control-character bypasses", () => {
    expect(safeNextPath("/\\evil.example")).toBe("/app");
    expect(safeNextPath("/%2f%2fevil.example")).toBe("/app");
    expect(safeNextPath("/%09/evil.example")).toBe("/app");
    expect(safeNextPath("/app%5C%5Cevil.example")).toBe("/app");
    expect(safeNextPath("https://evil.example\\@edenida.com")).toBe("/app");
  });
});
