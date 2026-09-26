import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  calendarDateInTimeZone,
  countdownCopy,
  daysUntilWedding,
  formatMoney,
  formatWeddingDate,
  isValidIsoDate,
} from "./dates";

describe("isValidIsoDate", () => {
  it("accepts a real calendar date", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  it("rejects an impossible day", () => {
    expect(isValidIsoDate("2023-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
  });
});

describe("calendar dates", () => {
  const instant = new Date("2026-01-01T03:30:00Z");

  it("uses the wedding timezone, not UTC", () => {
    expect(calendarDateInTimeZone(instant, "America/Toronto")).toBe("2025-12-31");
    expect(calendarDateInTimeZone(instant, "Europe/Paris")).toBe("2026-01-01");
  });

  it("counts days until the wedding date in that timezone", () => {
    expect(daysUntilWedding("2026-01-01", instant, "America/Toronto")).toBe(1);
    expect(daysUntilWedding("2026-01-01", instant, "Europe/Paris")).toBe(0);
    expect(daysUntilWedding(null, instant, "America/Toronto")).toBeNull();
  });

  it("adds calendar days without drifting the month", () => {
    expect(addCalendarDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("countdownCopy", () => {
  it("describes a missing date, today, a future day, and a past day", () => {
    expect(countdownCopy(null).primary).toBe("Date à choisir");
    expect(countdownCopy(0).primary).toBe("Aujourd'hui");
    expect(countdownCopy(1)).toMatchObject({ primary: "1", secondary: "jour" });
    expect(countdownCopy(12).secondary).toBe("jours");
    expect(countdownCopy(-3).primary).toBe("Il y a 3 jours");
  });
});

describe("formatters", () => {
  it("formats a wedding date in French", () => {
    expect(formatWeddingDate("2027-06-12")).toMatch(/12/);
    expect(formatWeddingDate("2027-06-12").toLowerCase()).toMatch(/juin/);
    expect(formatWeddingDate("2027-06-12")).toMatch(/2027/);
  });

  it("formats cents as currency", () => {
    expect(formatMoney(2_500_000, "CAD")).toMatch(/25\D000/);
  });
});
