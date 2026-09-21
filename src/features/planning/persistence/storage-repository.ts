import { DEMO_MEMBERS, DEFAULT_WEDDING_TIMEZONE } from "../fixtures/demo";
import {
  createEmptyPlanningSnapshot,
  createSeededPlanningSnapshot,
} from "../domain/template";
import {
  planningSnapshotSchema,
  type PlanningSnapshot,
  type WeddingMemberRef,
} from "../domain/schemas";
import { createMemoryStorage, type KeyValueStorage } from "./storage";

export const PLANNING_STORAGE_KEY_PREFIX = "edenida.planning.v1:";

export type PlanningScenario = "seeded" | "empty" | "error";

export type PlanningLoadError = "unavailable" | "invalid";

export type PlanningLoadResult =
  | { ok: true; snapshot: PlanningSnapshot }
  | { ok: false; error: PlanningLoadError };

export type PlanningSaveResult = { ok: true } | { ok: false; error: "invalid" };

export type PlanningLoadOptions = {
  /** When true, a forced error or corrupt local payload can recover. */
  recover?: boolean;
};

/**
 * Port the data track implements with the signed-in Supabase client.
 * Wave A ships a local adapter only. No service role. No guest PII.
 */
export interface PlanningRepository {
  load(weddingId: string, options?: PlanningLoadOptions): Promise<PlanningLoadResult>;
  save(snapshot: PlanningSnapshot): Promise<PlanningSaveResult>;
}

export type StoragePlanningRepositoryOptions = {
  storage: KeyValueStorage;
  scenario: PlanningScenario;
  weddingDate: string | null;
  members?: readonly WeddingMemberRef[];
  timezone?: string;
};

export function planningStorageKey(weddingId: string): string {
  return `${PLANNING_STORAGE_KEY_PREFIX}${encodeURIComponent(weddingId)}`;
}

export function createStoragePlanningRepository(
  options: StoragePlanningRepositoryOptions,
): PlanningRepository {
  const members = options.members ?? DEMO_MEMBERS;
  const timezone = options.timezone ?? DEFAULT_WEDDING_TIMEZONE;

  const repository: PlanningRepository = {
    async load(weddingId, loadOptions) {
      if (options.scenario === "error" && !loadOptions?.recover) {
        return { ok: false, error: "unavailable" };
      }

      const key = planningStorageKey(weddingId);
      const raw = options.storage.getItem(key);
      if (raw !== null) {
        const parsed = parseStoredSnapshot(raw, weddingId);
        if (parsed.ok) return parsed;
        if (!loadOptions?.recover) return parsed;
        options.storage.removeItem(key);
      }

      if (options.scenario === "empty") {
        const snapshot = createEmptyPlanningSnapshot({
          weddingId,
          weddingDate: options.weddingDate,
          members,
          timezone,
        });
        const checked = planningSnapshotSchema.safeParse(snapshot);
        if (!checked.success) return { ok: false, error: "invalid" };
        return { ok: true, snapshot: checked.data };
      }

      const snapshot = createSeededPlanningSnapshot({
        weddingId,
        weddingDate: options.weddingDate,
        members,
        timezone,
      });
      const saved = await repository.save(snapshot);
      if (!saved.ok) return { ok: false, error: "invalid" };
      return { ok: true, snapshot };
    },

    async save(snapshot) {
      const parsed = planningSnapshotSchema.safeParse(snapshot);
      if (!parsed.success) return { ok: false, error: "invalid" };
      try {
        options.storage.setItem(
          planningStorageKey(parsed.data.weddingId),
          JSON.stringify(parsed.data),
        );
      } catch {
        return { ok: false, error: "invalid" };
      }
      return { ok: true };
    },
  };

  return repository;
}

export function createBrowserPlanningRepository(
  options: Omit<StoragePlanningRepositoryOptions, "storage">,
): PlanningRepository {
  if (typeof window === "undefined") {
    throw new Error("Browser planning repository is only available in the browser.");
  }
  return createStoragePlanningRepository({ ...options, storage: window.localStorage });
}

function parseStoredSnapshot(raw: string, weddingId: string): PlanningLoadResult {
  try {
    const parsed = planningSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.weddingId !== weddingId) {
      return { ok: false, error: "invalid" };
    }
    return { ok: true, snapshot: parsed.data };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

/** Test helper so unit tests can exercise the same port without a browser. */
export function createMemoryPlanningRepository(
  options: Omit<StoragePlanningRepositoryOptions, "storage"> & { storage?: KeyValueStorage },
): { repository: PlanningRepository; storage: KeyValueStorage } {
  const storage = options.storage ?? createMemoryStorage();
  return {
    storage,
    repository: createStoragePlanningRepository({ ...options, storage }),
  };
}
