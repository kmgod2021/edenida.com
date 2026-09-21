import { isoDateSchema } from "./domain/schemas";
import { utcToday } from "./domain/dates";
import type { PlanningScenario } from "./persistence/storage-repository";

export type PlanningDemoQuery = {
  scenario: PlanningScenario;
  weddingDate: string | null;
  today: string;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePlanningScenario(value: string | undefined): PlanningScenario {
  if (value === "empty" || value === "error") return value;
  return "seeded";
}

export function readPlanningDemoQuery(searchParams: {
  scenario?: string | string[];
  date?: string | string[];
  today?: string | string[];
}): PlanningDemoQuery {
  const dateRaw = first(searchParams.date);
  const todayRaw = first(searchParams.today);
  const weddingDate =
    dateRaw && isoDateSchema.safeParse(dateRaw).success ? dateRaw : null;
  const today =
    todayRaw && isoDateSchema.safeParse(todayRaw).success ? todayRaw : utcToday();

  return {
    scenario: parsePlanningScenario(first(searchParams.scenario)),
    weddingDate,
    today,
  };
}
