import type {
  CreateWeddingInput,
  CurrentWedding,
  UpdateWeddingInput,
  Wedding,
  WeddingSummary,
} from "../domain/types";

/**
 * Persistence port for the wedding workspace.
 * Wave A: fixture repository. Wave B: Supabase implementation over
 * `weddings` + `wedding_members` — same methods, no second membership table.
 */
export interface WeddingRepository {
  listWeddings(userId: string): Promise<readonly Wedding[]>;
  getCurrent(userId: string, weddingId: string): Promise<CurrentWedding | null>;
  getSummary(userId: string, weddingId: string): Promise<WeddingSummary | null>;
  createWedding(
    userId: string,
    input: CreateWeddingInput,
  ): Promise<CurrentWedding>;
  updateWedding(
    userId: string,
    weddingId: string,
    input: UpdateWeddingInput,
  ): Promise<CurrentWedding | null>;
}

export interface WeddingWorkspaceService {
  readonly viewerUserId: string;
  listWeddings(): Promise<readonly Wedding[]>;
  getCurrent(weddingId: string): Promise<CurrentWedding | null>;
  getSummary(weddingId: string): Promise<WeddingSummary | null>;
  createWedding(input: CreateWeddingInput): Promise<CurrentWedding>;
  updateWedding(
    weddingId: string,
    input: UpdateWeddingInput,
  ): Promise<CurrentWedding | null>;
}

export function createWeddingWorkspaceService(
  repository: WeddingRepository,
  viewerUserId: string,
): WeddingWorkspaceService {
  return {
    viewerUserId,
    listWeddings: () => repository.listWeddings(viewerUserId),
    getCurrent: (weddingId) => repository.getCurrent(viewerUserId, weddingId),
    getSummary: (weddingId) => repository.getSummary(viewerUserId, weddingId),
    createWedding: (input) => repository.createWedding(viewerUserId, input),
    updateWedding: (weddingId, input) =>
      repository.updateWedding(viewerUserId, weddingId, input),
  };
}
