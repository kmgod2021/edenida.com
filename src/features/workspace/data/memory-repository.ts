import { emptyModuleSignals } from "../domain/progress";
import { buildWeddingSummary, readCurrentWedding } from "../domain/summary";
import type {
  CreateWeddingInput,
  CurrentWedding,
  UpdateWeddingInput,
  Wedding,
  WeddingSummary,
} from "../domain/types";
import type { WeddingRepository } from "./repository";
import type { WorkspaceFixtureState } from "./state";

function membersOf(state: WorkspaceFixtureState, weddingId: string) {
  return state.members.filter((member) => member.weddingId === weddingId);
}

function isMember(
  state: WorkspaceFixtureState,
  weddingId: string,
  userId: string,
) {
  return state.members.some(
    (member) => member.weddingId === weddingId && member.userId === userId,
  );
}

function readCurrent(
  state: WorkspaceFixtureState,
  userId: string,
  weddingId: string,
): CurrentWedding | null {
  const wedding = state.weddings.find((item) => item.id === weddingId);
  if (!wedding || !isMember(state, weddingId, userId)) return null;
  return readCurrentWedding({
    wedding,
    members: membersOf(state, weddingId),
    viewerUserId: userId,
    partnerDisplayName: state.partnerDisplayNames[weddingId] ?? null,
    profileNames: state.profileNames,
  });
}

export function listWeddingsForUser(
  state: WorkspaceFixtureState,
  userId: string,
): Wedding[] {
  return state.weddings
    .filter((wedding) => isMember(state, wedding.id, userId))
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function applyCreateWedding(
  state: WorkspaceFixtureState,
  userId: string,
  input: CreateWeddingInput,
  now: Date,
  createId: () => string,
): { state: WorkspaceFixtureState; value: CurrentWedding } {
  const timestamp = now.toISOString();
  const weddingId = createId();
  const wedding: Wedding = {
    id: weddingId,
    title: input.title,
    weddingDate: input.weddingDate,
    timezone: input.timezone,
    currency: input.currency,
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const next: WorkspaceFixtureState = {
    ...state,
    weddings: [wedding, ...state.weddings],
    members: [
      {
        id: createId(),
        weddingId,
        userId,
        role: "owner",
        createdAt: timestamp,
      },
      ...state.members,
    ],
    partnerDisplayNames: {
      ...state.partnerDisplayNames,
      [weddingId]: input.partnerName,
    },
    signals: {
      ...state.signals,
      [weddingId]: emptyModuleSignals(),
    },
  };
  const value = readCurrent(next, userId, weddingId);
  if (!value) {
    throw new Error("Created wedding was not readable by its owner");
  }
  return { state: next, value };
}

export function applyUpdateWedding(
  state: WorkspaceFixtureState,
  userId: string,
  weddingId: string,
  input: UpdateWeddingInput,
  now: Date,
): { state: WorkspaceFixtureState; value: CurrentWedding | null } {
  if (!isMember(state, weddingId, userId)) {
    return { state, value: null };
  }
  const next: WorkspaceFixtureState = {
    ...state,
    weddings: state.weddings.map((wedding) =>
      wedding.id === weddingId
        ? {
            ...wedding,
            title: input.title,
            weddingDate: input.weddingDate,
            timezone: input.timezone,
            currency: input.currency,
            updatedAt: now.toISOString(),
          }
        : wedding,
    ),
    partnerDisplayNames: {
      ...state.partnerDisplayNames,
      [weddingId]: input.partnerName,
    },
  };
  return { state: next, value: readCurrent(next, userId, weddingId) };
}

export function readSummaryForUser(
  state: WorkspaceFixtureState,
  userId: string,
  weddingId: string,
  now: Date,
): WeddingSummary | null {
  const current = readCurrent(state, userId, weddingId);
  if (!current) return null;
  return buildWeddingSummary({
    wedding: current.wedding,
    partnerDisplayName: current.partnerDisplayName,
    signals: state.signals[weddingId] ?? emptyModuleSignals(),
    now,
  });
}

export function createMemoryWeddingRepository(
  seed: WorkspaceFixtureState,
  options: {
    persist?: (state: WorkspaceFixtureState) => Promise<void>;
    now?: () => Date;
    createId?: () => string;
  } = {},
): WeddingRepository & { debugState: () => WorkspaceFixtureState } {
  let state = seed;
  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? (() => crypto.randomUUID());
  const persist = options.persist ?? (async () => undefined);

  return {
    debugState: () => state,
    async listWeddings(userId) {
      return listWeddingsForUser(state, userId);
    },
    async getCurrent(userId, weddingId) {
      return readCurrent(state, userId, weddingId);
    },
    async getSummary(userId, weddingId) {
      return readSummaryForUser(state, userId, weddingId, now());
    },
    async createWedding(userId, input) {
      const result = applyCreateWedding(state, userId, input, now(), createId);
      state = result.state;
      await persist(state);
      return result.value;
    },
    async updateWedding(userId, weddingId, input) {
      const result = applyUpdateWedding(state, userId, weddingId, input, now());
      if (!result.value) return null;
      state = result.state;
      await persist(state);
      return result.value;
    },
  };
}
