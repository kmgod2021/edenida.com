import { describe, expect, it } from "vitest";
import { createEmptyWorkspace } from "../domain/workspace";
import { createSampleWorkspace } from "../fixtures/sample-workspace";
import { FinancePersistenceError } from "./errors";
import { LocalStorageFinanceRepository } from "./local-storage-repository";
import { MemoryFinanceRepository } from "./memory-repository";
import { financeStorageKey } from "./port";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("MemoryFinanceRepository", () => {
  it("round-trips a workspace and returns null when missing", async () => {
    const repo = new MemoryFinanceRepository();
    expect(await repo.load("missing")).toBeNull();

    const workspace = createSampleWorkspace("w-mem");
    await repo.save(workspace);
    const loaded = await repo.load("w-mem");
    expect(loaded?.totalBudgetCents).toBe(4_000_000);
    expect(loaded?.vendors).toHaveLength(2);
  });
});

describe("LocalStorageFinanceRepository", () => {
  it("round-trips through storage", async () => {
    const storage = new MemoryStorage();
    const repo = new LocalStorageFinanceRepository(storage);
    const workspace = createEmptyWorkspace("w-local");
    workspace.totalBudgetCents = 250_000;
    await repo.save(workspace);

    expect(storage.getItem(financeStorageKey("w-local"))).toContain("250000");
    const loaded = await repo.load("w-local");
    expect(loaded?.totalBudgetCents).toBe(250_000);
  });

  it("throws FinancePersistenceError on invalid JSON", async () => {
    const storage = new MemoryStorage();
    storage.setItem(financeStorageKey("w-bad"), "{not-json");
    const repo = new LocalStorageFinanceRepository(storage);
    await expect(repo.load("w-bad")).rejects.toBeInstanceOf(
      FinancePersistenceError,
    );
  });

  it("rejects unknown schema versions", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      financeStorageKey("w-ver"),
      JSON.stringify({
        ...createEmptyWorkspace("w-ver"),
        schemaVersion: 99,
      }),
    );
    const repo = new LocalStorageFinanceRepository(storage);
    await expect(repo.load("w-ver")).rejects.toMatchObject({
      code: "INVALID_SCHEMA",
    });
  });
});
