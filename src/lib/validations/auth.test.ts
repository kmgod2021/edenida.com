import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/validations/auth";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toContain("px-4");
  });
});

describe("signUpSchema", () => {
  it("accepts a valid payload", () => {
    const result = signUpSchema.safeParse({
      fullName: "Ange",
      email: "ange@example.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = signUpSchema.safeParse({
      fullName: "Ange",
      email: "ange@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
