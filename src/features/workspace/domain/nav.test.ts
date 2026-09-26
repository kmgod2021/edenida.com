import { describe, expect, it } from "vitest";

import { isNavItemActive, workspaceNavItems } from "./nav";

describe("workspaceNavItems", () => {
  const items = workspaceNavItems("33333333-3333-4333-8333-333333333333");

  it("lists the P0 shell and leaves Phase 8 and 9 out", () => {
    expect(items.map((item) => item.id)).toEqual([
      "dashboard",
      "website",
      "guests",
      "planning",
      "budget",
      "vendors",
      "settings",
    ]);
    const hrefs = items.map((item) => item.href).join(" ");
    expect(hrefs).not.toMatch(/seating|notes|files|inspiration/);
    expect(hrefs).toContain("/app/weddings/");
    expect(hrefs).toContain("/planning");
    expect(hrefs).not.toMatch(/\/app\/w\/|\/checklist/);
  });

  it("marks only the dashboard on the exact wedding path", () => {
    const dashboard = items[0];
    const guests = items[2];
    if (!dashboard || !guests) throw new Error("nav missing");
    const path = "/app/weddings/33333333-3333-4333-8333-333333333333";
    const planning = items.find((item) => item.id === "planning");
    expect(planning?.href).toBe(`${path}/planning`);
    expect(isNavItemActive(dashboard, path)).toBe(true);
    expect(isNavItemActive(guests, path)).toBe(false);
    expect(isNavItemActive(guests, `${path}/guests`)).toBe(true);
    expect(isNavItemActive(dashboard, `${path}/guests`)).toBe(false);
  });
});
