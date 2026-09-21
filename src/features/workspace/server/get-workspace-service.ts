import { cache } from "react";

import { createMemoryWeddingRepository } from "../data/memory-repository";
import {
  createWeddingWorkspaceService,
  type WeddingWorkspaceService,
} from "../data/repository";
import { FIXTURE_VIEWER_USER_ID } from "../data/state";
import { readWorkspaceState, writeWorkspaceState } from "./cookie-store";

/**
 * Wave A always returns the fixture repository.
 * Wave B (EDE-WORKSPACE-002) replaces this function body with a Supabase
 * repository when a session exists. UI code must keep calling the service.
 *
 * The fixture viewer id is not an authenticated user. Do not reuse it once
 * queries hit Postgres.
 */
export const getWeddingWorkspaceService = cache(
  async (): Promise<WeddingWorkspaceService> => {
    const seed = await readWorkspaceState();
    const repository = createMemoryWeddingRepository(seed, {
      persist: writeWorkspaceState,
    });
    return createWeddingWorkspaceService(repository, FIXTURE_VIEWER_USER_ID);
  },
);
