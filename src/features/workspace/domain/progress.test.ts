import { describe, expect, it } from "vitest";

import { buildProgress, emptyModuleSignals } from "./progress";

describe("buildProgress", () => {
  it("is zero when nothing has started", () => {
    const progress = buildProgress({
      weddingDate: null,
      signals: emptyModuleSignals(),
    });
    expect(progress.percent).toBe(0);
    expect(progress.steps.every((step) => step.ratio === 0)).toBe(true);
  });

  it("counts a chosen date as one of five bases", () => {
    const progress = buildProgress({
      weddingDate: "2027-06-12",
      signals: emptyModuleSignals(),
    });
    expect(progress.percent).toBe(20);
  });

  it("averages partial website, RSVP, and checklist signals", () => {
    const progress = buildProgress({
      weddingDate: "2027-06-12",
      signals: {
        websiteStatus: "draft",
        guestCount: 12,
        rsvpCount: 5,
        tasksCompleted: 4,
        tasksTotal: 10,
        budgetPlannedCents: 2_500_000,
        budgetSpentCents: 400_000,
      },
    });
    expect(progress.percent).toBe(66);
    expect(progress.steps.map((step) => step.id)).toEqual([
      "date",
      "website",
      "guests",
      "checklist",
      "budget",
    ]);
  });

  it("does not divide by zero when there are no guests or tasks", () => {
    const progress = buildProgress({
      weddingDate: null,
      signals: {
        ...emptyModuleSignals(),
        rsvpCount: 3,
        tasksCompleted: 2,
      },
    });
    expect(progress.percent).toBe(0);
  });
});
