import {
  addEventInputSchema,
  addTaskInputSchema,
  addTimelineInputSchema,
  planningSnapshotSchema,
  taskCategorySchema,
  taskPatchSchema,
  type AddEventInput,
  type AddTaskInput,
  type AddTimelineInput,
  type PlanningSnapshot,
  type TaskPatch,
} from "./schemas";

export type PlanningCommand =
  | { type: "add-category"; name: string }
  | { type: "add-task"; input: AddTaskInput }
  | { type: "patch-task"; taskId: string; patch: TaskPatch }
  | { type: "remove-task"; taskId: string }
  | { type: "add-event"; input: AddEventInput }
  | { type: "remove-event"; eventId: string }
  | { type: "add-timeline-item"; input: AddTimelineInput }
  | { type: "remove-timeline-item"; itemId: string };

export type PlanningCommandResult =
  | { ok: true; snapshot: PlanningSnapshot }
  | { ok: false; message: string };

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

function fail(message: string): PlanningCommandResult {
  return { ok: false, message };
}

function accept(snapshot: PlanningSnapshot): PlanningCommandResult {
  const parsed = planningSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return fail("Planning invalide");
  return { ok: true, snapshot: parsed.data };
}

function issueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Donnée invalide";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "categorie";
}

function memberExists(snapshot: PlanningSnapshot, memberId: string | null): boolean {
  if (memberId === null) return true;
  return snapshot.members.some((member) => member.id === memberId);
}

function categoryExists(snapshot: PlanningSnapshot, categoryId: string): boolean {
  return snapshot.categories.some((category) => category.id === categoryId);
}

export function compareTasks(
  left: PlanningSnapshot["tasks"][number],
  right: PlanningSnapshot["tasks"][number],
): number {
  if (left.dueDate === null && right.dueDate !== null) return 1;
  if (left.dueDate !== null && right.dueDate === null) return -1;
  if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
    return left.dueDate < right.dueDate ? -1 : 1;
  }
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
}

function addCategory(snapshot: PlanningSnapshot, name: string): PlanningCommandResult {
  const parsed = taskCategorySchema.shape.name.safeParse(name);
  if (!parsed.success) return fail(issueMessage(parsed.error));

  const exists = snapshot.categories.some(
    (category) => category.name.localeCompare(parsed.data, "fr", { sensitivity: "accent" }) === 0,
  );
  if (exists) return fail("Cette catégorie existe déjà.");

  const sortOrder =
    snapshot.categories.reduce((max, category) => Math.max(max, category.sortOrder), -1) + 1;
  const base = `category:${slugify(parsed.data)}`;
  const id = snapshot.categories.some((category) => category.id === base)
    ? createId("category")
    : base;

  return accept({
    ...snapshot,
    categories: [
      ...snapshot.categories,
      { id, weddingId: snapshot.weddingId, name: parsed.data, sortOrder },
    ],
  });
}

function addTask(snapshot: PlanningSnapshot, input: AddTaskInput): PlanningCommandResult {
  const parsed = addTaskInputSchema.safeParse(input);
  if (!parsed.success) return fail(issueMessage(parsed.error));
  if (!categoryExists(snapshot, parsed.data.categoryId)) {
    return fail("Choisissez une catégorie.");
  }
  if (!memberExists(snapshot, parsed.data.assigneeMemberId)) {
    return fail("Cette personne ne fait pas partie du mariage.");
  }

  return accept({
    ...snapshot,
    tasks: [
      ...snapshot.tasks,
      {
        id: createId("task"),
        weddingId: snapshot.weddingId,
        status: "todo",
        ...parsed.data,
      },
    ],
  });
}

function patchTask(
  snapshot: PlanningSnapshot,
  taskId: string,
  patch: TaskPatch,
): PlanningCommandResult {
  const parsed = taskPatchSchema.safeParse(patch);
  if (!parsed.success) return fail(issueMessage(parsed.error));
  const current = snapshot.tasks.find((task) => task.id === taskId);
  if (!current) return fail("Tâche introuvable.");

  const next = { ...current, ...parsed.data };
  if (!categoryExists(snapshot, next.categoryId)) return fail("Choisissez une catégorie.");
  if (!memberExists(snapshot, next.assigneeMemberId)) {
    return fail("Cette personne ne fait pas partie du mariage.");
  }

  return accept({
    ...snapshot,
    tasks: snapshot.tasks.map((task) => (task.id === taskId ? next : task)),
  });
}

function removeTask(snapshot: PlanningSnapshot, taskId: string): PlanningCommandResult {
  if (!snapshot.tasks.some((task) => task.id === taskId)) return fail("Tâche introuvable.");
  return accept({
    ...snapshot,
    tasks: snapshot.tasks.filter((task) => task.id !== taskId),
  });
}

function addEvent(snapshot: PlanningSnapshot, input: AddEventInput): PlanningCommandResult {
  const parsed = addEventInputSchema.safeParse(input);
  if (!parsed.success) return fail(issueMessage(parsed.error));
  if (
    parsed.data.startTime &&
    parsed.data.endTime &&
    parsed.data.endTime < parsed.data.startTime
  ) {
    return fail("L'heure de fin précède l'heure de début.");
  }

  return accept({
    ...snapshot,
    events: [
      ...snapshot.events,
      {
        id: createId("event"),
        weddingId: snapshot.weddingId,
        ...parsed.data,
      },
    ],
  });
}

function removeEvent(snapshot: PlanningSnapshot, eventId: string): PlanningCommandResult {
  if (!snapshot.events.some((event) => event.id === eventId)) {
    return fail("Événement introuvable.");
  }
  return accept({
    ...snapshot,
    events: snapshot.events.filter((event) => event.id !== eventId),
  });
}

function addTimelineItem(
  snapshot: PlanningSnapshot,
  input: AddTimelineInput,
): PlanningCommandResult {
  const parsed = addTimelineInputSchema.safeParse(input);
  if (!parsed.success) return fail(issueMessage(parsed.error));
  if (!memberExists(snapshot, parsed.data.responsibleMemberId)) {
    return fail("Cette personne ne fait pas partie du mariage.");
  }

  const sortOrder =
    snapshot.timeline.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

  return accept({
    ...snapshot,
    timeline: [
      ...snapshot.timeline,
      {
        id: createId("timeline"),
        weddingId: snapshot.weddingId,
        sortOrder,
        ...parsed.data,
      },
    ],
  });
}

function removeTimelineItem(snapshot: PlanningSnapshot, itemId: string): PlanningCommandResult {
  if (!snapshot.timeline.some((item) => item.id === itemId)) {
    return fail("Moment introuvable.");
  }
  return accept({
    ...snapshot,
    timeline: snapshot.timeline.filter((item) => item.id !== itemId),
  });
}

export function applyPlanningCommand(
  snapshot: PlanningSnapshot,
  command: PlanningCommand,
): PlanningCommandResult {
  switch (command.type) {
    case "add-category":
      return addCategory(snapshot, command.name);
    case "add-task":
      return addTask(snapshot, command.input);
    case "patch-task":
      return patchTask(snapshot, command.taskId, command.patch);
    case "remove-task":
      return removeTask(snapshot, command.taskId);
    case "add-event":
      return addEvent(snapshot, command.input);
    case "remove-event":
      return removeEvent(snapshot, command.eventId);
    case "add-timeline-item":
      return addTimelineItem(snapshot, command.input);
    case "remove-timeline-item":
      return removeTimelineItem(snapshot, command.itemId);
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
}

export function sortEvents(
  events: readonly PlanningSnapshot["events"][number][],
): PlanningSnapshot["events"] {
  return [...events].sort((left, right) => {
    if (left.date === null && right.date !== null) return 1;
    if (left.date !== null && right.date === null) return -1;
    if (left.date && right.date && left.date !== right.date) {
      return left.date < right.date ? -1 : 1;
    }
    const leftTime = left.startTime ?? "99:99";
    const rightTime = right.startTime ?? "99:99";
    return leftTime < rightTime ? -1 : leftTime > rightTime ? 1 : 0;
  });
}

export function sortTimeline(
  items: readonly PlanningSnapshot["timeline"][number][],
): PlanningSnapshot["timeline"] {
  return [...items].sort((left, right) => {
    if (left.time !== right.time) return left.time < right.time ? -1 : 1;
    return left.sortOrder - right.sortOrder;
  });
}
