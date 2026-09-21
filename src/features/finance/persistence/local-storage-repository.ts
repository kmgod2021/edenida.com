import type { FinanceWorkspace } from "../domain/types";
import { financeWorkspaceSchema } from "../domain/schemas";
import { FinancePersistenceError } from "./errors";
import { financeStorageKey, type FinanceRepository } from "./port";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class LocalStorageFinanceRepository implements FinanceRepository {
  constructor(private readonly storage: StorageLike) {}

  async load(weddingId: string): Promise<FinanceWorkspace | null> {
    let raw: string | null;
    try {
      raw = this.storage.getItem(financeStorageKey(weddingId));
    } catch (cause) {
      throw new FinancePersistenceError(
        "STORAGE_UNAVAILABLE",
        "Stockage local indisponible.",
        { cause },
      );
    }

    if (raw === null) return null;

    let json: unknown;
    try {
      json = JSON.parse(raw) as unknown;
    } catch (cause) {
      throw new FinancePersistenceError(
        "INVALID_JSON",
        "Données finance locales illisibles.",
        { cause },
      );
    }

    const parsed = financeWorkspaceSchema.safeParse(json);
    if (!parsed.success) {
      throw new FinancePersistenceError(
        "INVALID_SCHEMA",
        "Données finance locales incompatibles.",
      );
    }

    return parsed.data;
  }

  async save(workspace: FinanceWorkspace): Promise<void> {
    const parsed = financeWorkspaceSchema.safeParse(workspace);
    if (!parsed.success) {
      throw new FinancePersistenceError(
        "INVALID_SCHEMA",
        "Espace finance invalide — enregistrement refusé.",
      );
    }

    try {
      this.storage.setItem(
        financeStorageKey(workspace.weddingId),
        JSON.stringify(parsed.data),
      );
    } catch (cause) {
      throw new FinancePersistenceError(
        "STORAGE_UNAVAILABLE",
        "Impossible d'enregistrer l'espace finance localement.",
        { cause },
      );
    }
  }

  async clear(weddingId: string): Promise<void> {
    try {
      this.storage.removeItem(financeStorageKey(weddingId));
    } catch (cause) {
      throw new FinancePersistenceError(
        "STORAGE_UNAVAILABLE",
        "Impossible d'effacer l'espace finance local.",
        { cause },
      );
    }
  }
}
