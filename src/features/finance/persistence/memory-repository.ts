import type { FinanceWorkspace } from "../domain/types";
import { financeWorkspaceSchema } from "../domain/schemas";
import { FinancePersistenceError } from "./errors";
import type { FinanceRepository } from "./port";

export class MemoryFinanceRepository implements FinanceRepository {
  private readonly store = new Map<string, FinanceWorkspace>();

  async load(weddingId: string): Promise<FinanceWorkspace | null> {
    const found = this.store.get(weddingId);
    return found ? structuredClone(found) : null;
  }

  async save(workspace: FinanceWorkspace): Promise<void> {
    const parsed = financeWorkspaceSchema.safeParse(workspace);
    if (!parsed.success) {
      throw new FinancePersistenceError(
        "INVALID_SCHEMA",
        "Espace finance invalide — enregistrement refusé.",
      );
    }
    this.store.set(workspace.weddingId, structuredClone(parsed.data));
  }

  async clear(weddingId: string): Promise<void> {
    this.store.delete(weddingId);
  }
}
