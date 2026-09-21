import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { createSeededPlanningSnapshot } from "./template";
import { DEMO_MEMBERS } from "../fixtures/demo";

describe("planning template", () => {
  it("dates tasks, events, and assignees from the wedding date", () => {
    const snapshot = createSeededPlanningSnapshot({
      weddingId: "wedding_1",
      weddingDate: "2027-06-19",
      members: DEMO_MEMBERS,
    });

    const bookVenue = snapshot.tasks.find((task) => task.id === "task:book-venue");
    expect(bookVenue).toMatchObject({
      dueDate: addDays("2027-06-19", -365),
      priority: "high",
      assigneeMemberId: "member-owner",
      categoryId: "category:venue",
    });

    expect(snapshot.events.find((event) => event.id === "event:ceremony")).toMatchObject({
      kind: "wedding",
      date: "2027-06-19",
      location: "Chapelle du domaine",
    });
    expect(snapshot.events.find((event) => event.id === "event:tasting")).toMatchObject({
      kind: "planning",
      date: addDays("2027-06-19", -60),
    });
    expect(snapshot.timeline.find((item) => item.id === "timeline:ceremony")).toMatchObject({
      time: "15:00",
      activity: "Cérémonie",
      location: "Chapelle du domaine",
      responsibleMemberId: "member-owner",
      notes: "Entrée, lectures, échange des vœux.",
    });
    expect(snapshot.categories.map((category) => category.name)).toEqual([
      "Lieu",
      "Invités",
      "Prestataires",
      "Tenues",
      "Jour J",
    ]);
  });

  it("keeps the checklist when the wedding date is still unknown", () => {
    const snapshot = createSeededPlanningSnapshot({
      weddingId: "wedding_1",
      weddingDate: null,
      members: [],
    });

    expect(snapshot.tasks.every((task) => task.dueDate === null)).toBe(true);
    expect(snapshot.tasks.every((task) => task.assigneeMemberId === null)).toBe(true);
    expect(snapshot.events.every((event) => event.date === null)).toBe(true);
    expect(snapshot.timeline[0]?.time).toBe("13:30");
  });
});
