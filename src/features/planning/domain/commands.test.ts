import { describe, expect, it } from "vitest";
import { applyPlanningCommand, sortTimeline } from "./commands";
import { createEmptyPlanningSnapshot, createSeededPlanningSnapshot } from "./template";
import { DEMO_MEMBERS } from "../fixtures/demo";

function seeded() {
  return createSeededPlanningSnapshot({
    weddingId: "wedding_1",
    weddingDate: "2027-06-19",
    members: DEMO_MEMBERS,
  });
}

describe("planning commands", () => {
  it("adds a category and rejects a duplicate name", () => {
    const empty = createEmptyPlanningSnapshot({
      weddingId: "wedding_1",
      weddingDate: null,
      members: DEMO_MEMBERS,
    });
    const created = applyPlanningCommand(empty, { type: "add-category", name: "  Papeterie " });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.snapshot.categories[0]).toMatchObject({
      name: "Papeterie",
      id: "category:papeterie",
    });

    const duplicate = applyPlanningCommand(created.snapshot, {
      type: "add-category",
      name: "Papeterie",
    });
    expect(duplicate).toEqual({ ok: false, message: "Cette catégorie existe déjà." });
  });

  it("adds, completes, reassigns, and removes a task", () => {
    const snapshot = seeded();
    const added = applyPlanningCommand(snapshot, {
      type: "add-task",
      input: {
        title: "  Envoyer le plan d'accès ",
        categoryId: "category:guests",
        priority: "medium",
        dueDate: "2026-09-28",
        assigneeMemberId: "member-partner",
        notes: "Joindre le stationnement.",
      },
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const task = added.snapshot.tasks.find((item) => item.title === "Envoyer le plan d'accès");
    expect(task).toMatchObject({ status: "todo", assigneeMemberId: "member-partner" });
    if (!task) return;

    const done = applyPlanningCommand(added.snapshot, {
      type: "patch-task",
      taskId: task.id,
      patch: { status: "done", assigneeMemberId: null },
    });
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.snapshot.tasks.find((item) => item.id === task.id)?.status).toBe("done");

    const removed = applyPlanningCommand(done.snapshot, {
      type: "remove-task",
      taskId: task.id,
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.snapshot.tasks.some((item) => item.id === task.id)).toBe(false);
  });

  it("rejects a blank title, an unknown assignee, and a backwards event", () => {
    const snapshot = seeded();
    expect(
      applyPlanningCommand(snapshot, {
        type: "add-task",
        input: {
          title: "   ",
          categoryId: "category:venue",
          priority: "low",
          dueDate: null,
          assigneeMemberId: null,
          notes: "",
        },
      }).ok,
    ).toBe(false);

    const unknown = applyPlanningCommand(snapshot, {
      type: "patch-task",
      taskId: "task:book-venue",
      patch: { assigneeMemberId: "member-missing" },
    });
    expect(unknown.ok).toBe(false);

    const event = applyPlanningCommand(snapshot, {
      type: "add-event",
      input: {
        title: "Essayage",
        kind: "planning",
        date: "2027-05-01",
        startTime: "16:00",
        endTime: "15:00",
        location: "",
        notes: "",
      },
    });
    expect(event).toEqual({
      ok: false,
      message: "L'heure de fin précède l'heure de début.",
    });
  });

  it("inserts a timeline moment in time order", () => {
    const snapshot = seeded();
    const added = applyPlanningCommand(snapshot, {
      type: "add-timeline-item",
      input: {
        time: "14:15",
        activity: "Arrivée des mariés",
        location: "Parvis",
        responsibleMemberId: "member-owner",
        notes: "Prévoir dix minutes de battement.",
      },
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const ordered = sortTimeline(added.snapshot.timeline).map((item) => item.activity);
    expect(ordered.indexOf("Arrivée des mariés")).toBe(1);
  });
});
