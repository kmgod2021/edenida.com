import { describe, expect, it } from "vitest";

import { buildRsvpDashboard } from "@/features/guests/domain/rsvp-summary";
import { createDemoStore } from "@/features/guests/data/memory-repository";

describe("buildRsvpDashboard", () => {
  it("summarizes the demo wedding without counting uninvited guests as awaiting", () => {
    const store = createDemoStore();
    const dashboard = buildRsvpDashboard({
      guests: store.guests,
      rsvps: store.rsvps,
      events: store.wedding.events,
    });

    expect(dashboard).toMatchObject({
      invited: 6,
      attending: 3,
      declined: 1,
      awaiting: 2,
      notInvited: 1,
      plusOnesAllowed: 2,
      plusOnesAttending: 0,
    });
    expect(dashboard.meals).toEqual(
      expect.arrayContaining([
        { choice: "meat", count: 1 },
        { choice: "fish", count: 1 },
        { choice: "child", count: 1 },
      ]),
    );
    expect(dashboard.dietary).toEqual([{ restriction: "gluten_free", count: 1 }]);

    const brunch = dashboard.events.find((event) => event.eventId === "evt-brunch");
    expect(brunch).toEqual({
      eventId: "evt-brunch",
      name: "Brunch",
      attending: 1,
      declined: 0,
      pending: 1,
    });
    expect(dashboard.recent.map((item) => item.name)).toEqual([
      "Noah Petit",
      "Samir Diallo",
      "Awa Diallo",
      "Marc Martin",
    ]);
  });
});
