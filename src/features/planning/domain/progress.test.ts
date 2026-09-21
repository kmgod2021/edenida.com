import { describe, expect, it } from "vitest";
import { checklistProgress, isOverdue, isUpcoming } from "./progress";
import type { PlanningTask } from "./schemas";

function task(overrides: Partial<PlanningTask> = {}): PlanningTask {
  return {
    id: "task_1",
    weddingId: "wedding_1",
    categoryId: "category_1",
    title: "Réserver le lieu",
    notes: "",
    priority: "high",
    status: "todo",
    dueDate: "2026-06-19",
    assigneeMemberId: null,
    ...overrides,
  };
}

describe("checklistProgress", () => {
  it("reports zero without dividing by an empty list", () => {
    expect(checklistProgress([])).toEqual({ total: 0, done: 0, percent: 0 });
  });

  it("rounds the done ratio and ignores in-progress tasks", () => {
    const tasks = [
      task({ id: "a", status: "done" }),
      task({ id: "b", status: "in_progress" }),
      task({ id: "c", status: "todo" }),
    ];
    expect(checklistProgress(tasks)).toEqual({ total: 3, done: 1, percent: 33 });
  });
});

describe("overdue and upcoming", () => {
  const today = "2026-09-21";

  it("treats a past open task as overdue and a done task as clear", () => {
    expect(isOverdue(task({ dueDate: "2026-09-20" }), today)).toBe(true);
    expect(isOverdue(task({ dueDate: today }), today)).toBe(false);
    expect(isOverdue(task({ dueDate: "2026-09-20", status: "done" }), today)).toBe(
      false,
    );
    expect(isOverdue(task({ dueDate: null }), today)).toBe(false);
  });

  it("includes today and the window edge, and excludes done tasks", () => {
    expect(isUpcoming(task({ dueDate: today }), today)).toBe(true);
    expect(isUpcoming(task({ dueDate: "2026-10-12" }), today)).toBe(true);
    expect(isUpcoming(task({ dueDate: "2026-10-13" }), today)).toBe(false);
    expect(isUpcoming(task({ dueDate: "2026-09-20" }), today)).toBe(false);
    expect(isUpcoming(task({ dueDate: today, status: "done" }), today)).toBe(false);
  });
});
