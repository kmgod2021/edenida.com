import { describe, expect, it } from "vitest";
import { readPlanningDemoQuery } from "./demo-query";

describe("readPlanningDemoQuery", () => {
  it("accepts a demo scenario and ignores invalid dates", () => {
    expect(
      readPlanningDemoQuery({
        scenario: "empty",
        date: "2027-02-31",
        today: "2026-09-21",
      }),
    ).toEqual({
      scenario: "empty",
      weddingDate: null,
      today: "2026-09-21",
    });
  });

  it("defaults to the seeded scenario", () => {
    const query = readPlanningDemoQuery({ scenario: ["nope", "error"] });
    expect(query.scenario).toBe("seeded");
    expect(query.weddingDate).toBeNull();
    expect(query.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
