import { addDays } from "./dates";
import type { PlanningTask } from "./schemas";

/** Tasks due inside this window, including today, count as upcoming. */
export const UPCOMING_WINDOW_DAYS = 21;

export type ChecklistProgress = {
  total: number;
  done: number;
  percent: number;
};

export function checklistProgress(tasks: readonly PlanningTask[]): ChecklistProgress {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

export function isOverdue(task: PlanningTask, today: string): boolean {
  return task.status !== "done" && task.dueDate !== null && task.dueDate < today;
}

export function isUpcoming(
  task: PlanningTask,
  today: string,
  windowDays = UPCOMING_WINDOW_DAYS,
): boolean {
  if (task.status === "done" || task.dueDate === null) return false;
  const end = addDays(today, windowDays);
  return task.dueDate >= today && task.dueDate <= end;
}

export type ChecklistFilter = "all" | "overdue" | "upcoming";

export function taskMatchesFilter(
  task: PlanningTask,
  filter: ChecklistFilter,
  today: string,
): boolean {
  if (filter === "overdue") return isOverdue(task, today);
  if (filter === "upcoming") return isUpcoming(task, today);
  return true;
}
