import type { ModuleSignals, ProgressStep, ProgressStepId } from "./types";

export type ProgressInput = {
  weddingDate: string | null;
  signals: ModuleSignals;
};

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function ratioFor(id: ProgressStepId, input: ProgressInput): number {
  const { signals } = input;
  switch (id) {
    case "date":
      return input.weddingDate ? 1 : 0;
    case "website":
      if (signals.websiteStatus === "published") return 1;
      if (signals.websiteStatus === "draft") return 0.5;
      return 0;
    case "guests":
      if (signals.guestCount <= 0) return 0;
      return clampRatio(signals.rsvpCount / signals.guestCount);
    case "checklist":
      if (signals.tasksTotal <= 0) return 0;
      return clampRatio(signals.tasksCompleted / signals.tasksTotal);
    case "budget":
      return signals.budgetPlannedCents === null ? 0 : 1;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

const STEP_ORDER: ProgressStepId[] = [
  "date",
  "website",
  "guests",
  "checklist",
  "budget",
];

export function buildProgress(input: ProgressInput): {
  percent: number;
  steps: ProgressStep[];
} {
  const steps = STEP_ORDER.map((id) => ({
    id,
    ratio: ratioFor(id, input),
  }));
  const mean = steps.reduce((sum, step) => sum + step.ratio, 0) / steps.length;
  return {
    percent: Math.round(mean * 100),
    steps,
  };
}

export function emptyModuleSignals(): ModuleSignals {
  return {
    websiteStatus: "not_started",
    guestCount: 0,
    rsvpCount: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    budgetPlannedCents: null,
    budgetSpentCents: null,
  };
}
