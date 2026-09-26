import { describe, expect, it } from "vitest";

import { toWeddingDetails, weddingDetailsSchema } from "./validation";

const valid = {
  title: "Camille & Julien",
  partnerName: "Julien Morel",
  weddingDate: "2027-06-12",
  timezone: "America/Toronto",
  currency: "CAD",
};

describe("weddingDetailsSchema", () => {
  it("accepts a complete form and keeps the partner name off the membership model", () => {
    const parsed = weddingDetailsSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toWeddingDetails(parsed.data)).toEqual({
      title: "Camille & Julien",
      partnerName: "Julien Morel",
      weddingDate: "2027-06-12",
      timezone: "America/Toronto",
      currency: "CAD",
    });
  });

  it("turns a blank partner and date into null", () => {
    const parsed = weddingDetailsSchema.parse({
      ...valid,
      partnerName: "  ",
      weddingDate: "",
    });
    expect(toWeddingDetails(parsed)).toMatchObject({
      partnerName: null,
      weddingDate: null,
    });
  });

  it("rejects an empty title, a bad date, and an unknown timezone", () => {
    expect(
      weddingDetailsSchema.safeParse({ ...valid, title: "  " }).success,
    ).toBe(false);
    expect(
      weddingDetailsSchema.safeParse({ ...valid, weddingDate: "2023-02-29" })
        .success,
    ).toBe(false);
    expect(
      weddingDetailsSchema.safeParse({ ...valid, timezone: "Mars/Olympus" })
        .success,
    ).toBe(false);
  });
});
