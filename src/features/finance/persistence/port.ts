import type { FinanceWorkspace } from "../domain/types";

/**
 * Persistence port for wedding finance workspaces.
 * Wave A ships memory + localStorage adapters.
 * Supabase adapter is intentionally deferred (see handoff.ts).
 */
export interface FinanceRepository {
  load(weddingId: string): Promise<FinanceWorkspace | null>;
  save(workspace: FinanceWorkspace): Promise<void>;
  clear?(weddingId: string): Promise<void>;
}

export const FINANCE_STORAGE_KEY_PREFIX = "edenida.finance.workspace.v1";

export function financeStorageKey(weddingId: string): string {
  return `${FINANCE_STORAGE_KEY_PREFIX}.${weddingId}`;
}
