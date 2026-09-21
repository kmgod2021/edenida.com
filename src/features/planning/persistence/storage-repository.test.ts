import { describe, expect, it } from "vitest";
import { createSeededPlanningSnapshot } from "../domain/template";
import { DEMO_MEMBERS } from "../fixtures/demo";
import { createMemoryStorage } from "./storage";
import {
  createMemoryPlanningRepository,
  planningStorageKey,
} from "./storage-repository";

describe("planning storage repository", () => {
  it("round-trips a seeded snapshot and keeps edits", async () => {
    const { repository, storage } = createMemoryPlanningRepository({
      scenario: "seeded",
      weddingDate: "2027-06-19",
      members: DEMO_MEMBERS,
    });

    const loaded = await repository.load("wedding_1");
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const saved = await repository.save({
      ...loaded.snapshot,
      tasks: loaded.snapshot.tasks.map((task) =>
        task.id === "task:book-venue" ? { ...task, status: "done" } : task,
      ),
    });
    expect(saved).toEqual({ ok: true });

    const again = await repository.load("wedding_1");
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.snapshot.tasks.find((task) => task.id === "task:book-venue")?.status).toBe(
      "done",
    );
    expect(storage.getItem(planningStorageKey("wedding_1"))).toContain("wedding_1");
  });

  it("does not seed tasks for an empty scenario", async () => {
    const { repository } = createMemoryPlanningRepository({
      scenario: "empty",
      weddingDate: null,
    });
    const loaded = await repository.load("wedding_empty");
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.snapshot.tasks).toEqual([]);
    expect(loaded.snapshot.events).toEqual([]);
    expect(loaded.snapshot.timeline).toEqual([]);
  });

  it("fails closed on the first error load, then recovers into the template", async () => {
    const { repository } = createMemoryPlanningRepository({
      scenario: "error",
      weddingDate: "2027-06-19",
      members: DEMO_MEMBERS,
    });

    expect(await repository.load("wedding_err")).toEqual({
      ok: false,
      error: "unavailable",
    });

    const recovered = await repository.load("wedding_err", { recover: true });
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.snapshot.tasks.some((task) => task.id === "task:book-venue")).toBe(true);
  });

  it("rejects corrupt local data until recover clears it", async () => {
    const storage = createMemoryStorage();
    storage.setItem(planningStorageKey("wedding_bad"), "{not json");
    const { repository } = createMemoryPlanningRepository({
      storage,
      scenario: "seeded",
      weddingDate: "2027-06-19",
      members: DEMO_MEMBERS,
    });

    expect(await repository.load("wedding_bad")).toEqual({ ok: false, error: "invalid" });
    const recovered = await repository.load("wedding_bad", { recover: true });
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.snapshot.version).toBe(1);
  });

  it("refuses to persist a snapshot that fails the contract", async () => {
    const { repository } = createMemoryPlanningRepository({
      scenario: "empty",
      weddingDate: null,
    });
    const snapshot = createSeededPlanningSnapshot({
      weddingId: "wedding_1",
      weddingDate: "2027-06-19",
      members: DEMO_MEMBERS,
    });
    const dirty = { ...snapshot, guests: [{ email: "secret@example.com" }] };
    expect(await repository.save(dirty as typeof snapshot)).toEqual({
      ok: false,
      error: "invalid",
    });
  });
});
