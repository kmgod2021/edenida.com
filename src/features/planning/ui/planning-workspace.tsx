"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { applyPlanningCommand, type PlanningCommand } from "../domain/commands";
import { formatIsoDate } from "../domain/dates";
import type {
  AddEventInput,
  AddTaskInput,
  AddTimelineInput,
  PlanningSnapshot,
  TaskPatch,
} from "../domain/schemas";
import type { PlanningLoadError, PlanningRepository, PlanningScenario } from "../persistence/storage-repository";
import { createBrowserPlanningRepository } from "../persistence/storage-repository";
import { copy } from "./copy";
import { ChecklistView } from "./checklist-view";
import { EventsView } from "./events-view";
import { PlanningError, PlanningLoading } from "./states";
import { tabClassName } from "./styles";
import { TimelineView } from "./timeline-view";

type Section = "checklist" | "events" | "timeline";
type Phase = "loading" | "ready" | "error";
type FormResult = { ok: true } | { ok: false; message: string };

const SECTIONS: { id: Section; label: string }[] = [
  { id: "checklist", label: copy.checklist },
  { id: "events", label: copy.events },
  { id: "timeline", label: copy.timeline },
];

export type PlanningWorkspaceProps = {
  weddingId: string;
  scenario: PlanningScenario;
  weddingDate: string | null;
  today: string;
};

export function PlanningWorkspace({
  weddingId,
  scenario,
  weddingDate,
  today,
}: PlanningWorkspaceProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadError, setLoadError] = useState<PlanningLoadError>("unavailable");
  const [attempt, setAttempt] = useState(0);
  const [section, setSection] = useState<Section>("checklist");
  const [snapshot, setSnapshot] = useState<PlanningSnapshot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const repositoryRef = useRef<PlanningRepository | null>(null);
  const latestRef = useRef<PlanningSnapshot | null>(null);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const repository = createBrowserPlanningRepository({
      scenario,
      weddingDate,
    });
    repositoryRef.current = repository;

    void repository.load(weddingId, { recover: attempt > 0 }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        setPhase("error");
        setSnapshot(null);
        return;
      }
      latestRef.current = result.snapshot;
      setSnapshot(result.snapshot);
      setPhase("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, scenario, weddingDate, weddingId]);

  function persist(next: PlanningSnapshot) {
    latestRef.current = next;
    setSnapshot(next);
    setNotice(null);
    setSaveError(null);
    const repository = repositoryRef.current;
    if (!repository) return;

    queueRef.current = queueRef.current.then(async () => {
      const current = latestRef.current;
      if (!current) return;
      const saved = await repository.save(current);
      if (latestRef.current !== current) return;
      if (saved.ok) setNotice(copy.saved);
      else setSaveError(copy.saveFailed);
    });
  }

  function commit(command: PlanningCommand): FormResult {
    const current = latestRef.current;
    if (!current) return { ok: false, message: copy.errorUnavailable };
    const result = applyPlanningCommand(current, command);
    if (!result.ok) {
      setSaveError(result.message);
      return result;
    }
    persist(result.snapshot);
    return { ok: true };
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 motion-safe:animate-[fadeRise_700ms_ease-out] sm:px-6 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-3xl text-ink">
          {copy.brand}
        </Link>
        <Link href="/app" className="text-sm text-ink-muted transition hover:text-ink">
          {copy.workspace}
        </Link>
      </header>

      <h1 className="mt-10 font-display text-5xl text-ink sm:text-6xl">{copy.title}</h1>
      <p className="mt-3 max-w-xl text-ink-muted">{copy.intro}</p>
      {phase === "ready" && snapshot ? (
        <p className="mt-2 text-sm text-ink-muted">
          {snapshot.weddingDate
            ? `${copy.dateKnown} : ${formatIsoDate(snapshot.weddingDate)}`
            : copy.dateUnknown}
        </p>
      ) : null}

      {phase === "loading" ? <PlanningLoading /> : null}
      {phase === "error" ? (
        <PlanningError
          error={loadError}
          onRetry={() => {
            setPhase("loading");
            setAttempt((value) => value + 1);
          }}
        />
      ) : null}

      {phase === "ready" && snapshot ? (
        <>
          {notice ? (
            <p role="status" className="mt-4 text-sm text-accent-2">
              {notice}
            </p>
          ) : null}
          {saveError ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {saveError}
            </p>
          ) : null}

          <div role="tablist" aria-label={copy.tabsLabel} className="mt-8 flex border-b border-line">
            {SECTIONS.map((item) => {
              const selected = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={0}
                  className={tabClassName(selected)}
                  onClick={() => setSection(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${section}`}
            aria-labelledby={`tab-${section}`}
          >
            {section === "checklist" ? (
              <ChecklistView
                categories={snapshot.categories}
                tasks={snapshot.tasks}
                members={snapshot.members}
                today={today}
                onAddCategory={(name) => commit({ type: "add-category", name })}
                onAddTask={(input: AddTaskInput) => commit({ type: "add-task", input })}
                onPatchTask={(taskId, patch: TaskPatch) =>
                  commit({ type: "patch-task", taskId, patch })
                }
                onRemoveTask={(taskId) => commit({ type: "remove-task", taskId })}
              />
            ) : null}
            {section === "events" ? (
              <EventsView
                events={snapshot.events}
                onAddEvent={(input: AddEventInput) => commit({ type: "add-event", input })}
                onRemoveEvent={(eventId) => commit({ type: "remove-event", eventId })}
              />
            ) : null}
            {section === "timeline" ? (
              <TimelineView
                items={snapshot.timeline}
                members={snapshot.members}
                onAddItem={(input: AddTimelineInput) =>
                  commit({ type: "add-timeline-item", input })
                }
                onRemoveItem={(itemId) => commit({ type: "remove-timeline-item", itemId })}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
