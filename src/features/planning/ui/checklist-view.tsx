"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { compareTasks } from "../domain/commands";
import {
  checklistProgress,
  isOverdue,
  isUpcoming,
  taskMatchesFilter,
  UPCOMING_WINDOW_DAYS,
  type ChecklistFilter,
} from "../domain/progress";
import type {
  AddTaskInput,
  PlanningTask,
  TaskCategory,
  TaskPatch,
  TaskPriority,
  TaskStatus,
  WeddingMemberRef,
} from "../domain/schemas";
import { copy, priorityLabel, progressCount, statusLabel, upcomingEmptyCopy } from "./copy";
import { formatIsoDate } from "../domain/dates";
import {
  domId,
  Field,
  readNullable,
  readText,
  SelectInput,
  TextArea,
  TextInput,
} from "./fields";
import { filterClassName, primaryButtonClassName, quietButtonClassName } from "./styles";

type FormResult = { ok: true } | { ok: false; message: string };

export type ChecklistViewProps = {
  categories: readonly TaskCategory[];
  tasks: readonly PlanningTask[];
  members: readonly WeddingMemberRef[];
  today: string;
  initialFilter?: ChecklistFilter;
  onAddCategory: (name: string) => FormResult;
  onAddTask: (input: AddTaskInput) => FormResult;
  onPatchTask: (taskId: string, patch: TaskPatch) => void;
  onRemoveTask: (taskId: string) => void;
};

const FILTERS: { id: ChecklistFilter; label: string }[] = [
  { id: "all", label: copy.filterAll },
  { id: "overdue", label: copy.filterOverdue },
  { id: "upcoming", label: copy.filterUpcoming },
];

function memberName(members: readonly WeddingMemberRef[], memberId: string | null): string {
  if (!memberId) return copy.unassigned;
  return members.find((member) => member.id === memberId)?.displayName ?? copy.unassigned;
}

function Control({
  id,
  visible,
  label,
  children,
}: {
  id: string;
  visible: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 text-sm text-ink-muted">
      <span id={id} className="sr-only">
        {label}
      </span>
      <span aria-hidden="true">{visible}</span>
      {children}
    </div>
  );
}

export function ChecklistView({
  categories,
  tasks,
  members,
  today,
  initialFilter = "all",
  onAddCategory,
  onAddTask,
  onPatchTask,
  onRemoveTask,
}: ChecklistViewProps) {
  const [filter, setFilter] = useState<ChecklistFilter>(initialFilter);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const progress = checklistProgress(tasks);
  const overdueCount = tasks.filter((task) => isOverdue(task, today)).length;
  const upcomingCount = tasks.filter((task) => isUpcoming(task, today)).length;
  const knownCategories = new Set(categories.map((category) => category.id));
  const orderedCategories = [...categories].sort((left, right) => left.sortOrder - right.sortOrder);

  const groups = orderedCategories
    .map((category) => ({
      category,
      tasks: tasks
        .filter((task) => task.categoryId === category.id && taskMatchesFilter(task, filter, today))
        .sort(compareTasks),
    }))
    .filter((group) => filter === "all" || group.tasks.length > 0);

  const orphans = tasks
    .filter((task) => !knownCategories.has(task.categoryId) && taskMatchesFilter(task, filter, today))
    .sort(compareTasks);

  const visibleCount = groups.reduce((sum, group) => sum + group.tasks.length, 0) + orphans.length;

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = onAddCategory(readText(new FormData(form), "name"));
    if (!result.ok) {
      setCategoryError(result.message);
      return;
    }
    setCategoryError(null);
    form.reset();
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = onAddTask({
      title: readText(data, "title"),
      categoryId: readText(data, "categoryId"),
      priority: readText(data, "priority") as TaskPriority,
      dueDate: readNullable(data, "dueDate"),
      assigneeMemberId: readNullable(data, "assigneeMemberId"),
      notes: readText(data, "notes"),
    });
    if (!result.ok) {
      setTaskError(result.message);
      return;
    }
    setTaskError(null);
    form.reset();
  }

  return (
    <div className="mt-8">
      <div
        role="progressbar"
        aria-label={copy.progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={progressCount(progress.done, progress.total)}
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-ink">{progressCount(progress.done, progress.total)}</p>
          <p className="font-display text-4xl text-ink">{progress.percent}%</p>
        </div>
        <div className="mt-3 h-1 bg-line">
          <div className="h-1 bg-accent-2" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-muted">
        {overdueCount} en retard · {upcomingCount} à venir · {UPCOMING_WINDOW_DAYS} jours
      </p>

      <div role="radiogroup" aria-label={copy.filterLabel} className="mt-4 flex flex-wrap gap-4">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={filter === item.id}
            className={filterClassName(filter === item.id)}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            {item.id === "overdue" ? ` (${overdueCount})` : null}
            {item.id === "upcoming" ? ` (${upcomingCount})` : null}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="mt-8 text-ink">
          {copy.emptyTasks}{" "}
          <span className="text-ink-muted">{copy.emptyTasksHint}</span>
        </p>
      ) : null}

      {tasks.length > 0 && visibleCount === 0 ? (
        <p className="mt-8 text-ink">
          {filter === "overdue" ? copy.emptyOverdue : upcomingEmptyCopy()}
        </p>
      ) : null}

      <div className="mt-6">
        {groups.map((group) => (
          <section key={group.category.id} className="border-t border-line py-6">
            <h2 className="font-display text-3xl text-ink">{group.category.name}</h2>
            {group.tasks.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">{copy.emptyCategory}</p>
            ) : (
              <div>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    members={members}
                    today={today}
                    onPatchTask={onPatchTask}
                    onRemoveTask={onRemoveTask}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
        {orphans.length > 0 ? (
          <section className="border-t border-line py-6">
            <h2 className="font-display text-3xl text-ink">Autres</h2>
            {orphans.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                today={today}
                onPatchTask={onPatchTask}
                onRemoveTask={onRemoveTask}
              />
            ))}
          </section>
        ) : null}
      </div>

      <form aria-label={copy.addCategory} onSubmit={submitCategory} className="mt-4 border-t border-line pt-6">
        <h2 className="font-display text-3xl text-ink">{copy.addCategory}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label={copy.categoryName}>
            <TextInput name="name" required maxLength={80} autoComplete="off" />
          </Field>
          <button type="submit" className={primaryButtonClassName}>
            {copy.addCategorySubmit}
          </button>
        </div>
        {categoryError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {categoryError}
          </p>
        ) : null}
      </form>

      <form aria-label={copy.addTask} onSubmit={submitTask} className="mt-8 border-t border-line pt-6">
        <h2 className="font-display text-3xl text-ink">{copy.addTask}</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{copy.needCategory}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={copy.taskTitle}>
              <TextInput name="title" required maxLength={160} autoComplete="off" />
            </Field>
            <Field label={copy.taskCategory}>
              <SelectInput name="categoryId" defaultValue={orderedCategories[0]?.id}>
                {orderedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.taskPriority}>
              <SelectInput name="priority" defaultValue="medium">
                {(Object.keys(priorityLabel) as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel[priority]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.taskDue}>
              <TextInput name="dueDate" type="date" />
            </Field>
            <Field label={copy.taskAssignee}>
              <SelectInput name="assigneeMemberId" defaultValue="">
                <option value="">{copy.unassigned}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.taskNotes}>
              <TextArea name="notes" rows={2} maxLength={2000} />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" className={primaryButtonClassName}>
                {copy.addTaskSubmit}
              </button>
            </div>
          </div>
        )}
        {taskError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {taskError}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function TaskRow({
  task,
  members,
  today,
  onPatchTask,
  onRemoveTask,
}: {
  task: PlanningTask;
  members: readonly WeddingMemberRef[];
  today: string;
  onPatchTask: (taskId: string, patch: TaskPatch) => void;
  onRemoveTask: (taskId: string) => void;
}) {
  const overdue = isOverdue(task, today);
  const upcoming = isUpcoming(task, today);
  const base = domId(task.id);
  const knownAssignee = members.some((member) => member.id === task.assigneeMemberId);

  return (
    <article className="border-b border-line/80 py-5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-accent-2"
          checked={task.status === "done"}
          aria-label={`Marquer ${task.title} comme fait`}
          onChange={(event) =>
            onPatchTask(task.id, { status: event.target.checked ? "done" : "todo" })
          }
        />
        <div className="min-w-0 flex-1">
          <h3 className={task.status === "done" ? "text-ink-muted line-through" : "text-ink"}>
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {priorityLabel[task.priority]}
            {" · "}
            {task.dueDate ? formatIsoDate(task.dueDate) : "Sans date"}
            {" · "}
            {memberName(members, task.assigneeMemberId)}
            {overdue ? <span className="text-danger"> · {copy.overdue}</span> : null}
            {upcoming ? <span className="text-accent-2"> · {copy.upcoming}</span> : null}
          </p>
          {task.notes ? <p className="mt-2 text-sm text-ink-muted">{task.notes}</p> : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Control id={`${base}-status`} visible={copy.status} label={`${copy.status} de ${task.title}`}>
              <SelectInput
                aria-labelledby={`${base}-status`}
                value={task.status}
                onChange={(event) =>
                  onPatchTask(task.id, { status: event.target.value as TaskStatus })
                }
              >
                {(Object.keys(statusLabel) as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </SelectInput>
            </Control>
            <Control
              id={`${base}-priority`}
              visible={copy.priority}
              label={`${copy.priority} de ${task.title}`}
            >
              <SelectInput
                aria-labelledby={`${base}-priority`}
                value={task.priority}
                onChange={(event) =>
                  onPatchTask(task.id, { priority: event.target.value as TaskPriority })
                }
              >
                {(Object.keys(priorityLabel) as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel[priority]}
                  </option>
                ))}
              </SelectInput>
            </Control>
            <Control id={`${base}-due`} visible={copy.due} label={`${copy.due} de ${task.title}`}>
              <TextInput
                aria-labelledby={`${base}-due`}
                type="date"
                value={task.dueDate ?? ""}
                onChange={(event) =>
                  onPatchTask(task.id, { dueDate: event.target.value || null })
                }
              />
            </Control>
            <Control
              id={`${base}-assignee`}
              visible={copy.assignee}
              label={`Personne assignée à ${task.title}`}
            >
              <SelectInput
                aria-labelledby={`${base}-assignee`}
                value={knownAssignee ? (task.assigneeMemberId ?? "") : ""}
                onChange={(event) =>
                  onPatchTask(task.id, {
                    assigneeMemberId: event.target.value || null,
                  })
                }
              >
                <option value="">{copy.unassigned}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </SelectInput>
            </Control>
          </div>

          <button
            type="button"
            className={`${quietButtonClassName} mt-2`}
            onClick={() => onRemoveTask(task.id)}
          >
            {copy.deleteTask} {task.title}
          </button>
        </div>
      </div>
    </article>
  );
}
