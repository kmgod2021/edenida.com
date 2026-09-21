import { describe, expect, it } from "vitest";
import { addDays, formatIsoDate } from "./dates";

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2027-06-19", -365)).toBe("2026-06-19");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("rejects calendar-invalid dates", () => {
    expect(() => addDays("2027-02-31", 1)).toThrow(/Invalid ISO date/);
  });
});

describe("formatIsoDate", () => {
  it("formats a French calendar date without timezone drift", () => {
    expect(formatIsoDate("2027-06-19")).toBe("19 juin 2027");
    expect(formatIsoDate("2026-02-01")).toBe("1 février 2026");
  });
});
