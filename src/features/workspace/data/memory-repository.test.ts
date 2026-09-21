import { describe, expect, it } from "vitest";

import { createExampleWorkspaceState } from "./fixtures";
import {
  applyCreateWedding,
  createMemoryWeddingRepository,
  readSummaryForUser,
} from "./memory-repository";
import {
  createEmptyWorkspaceState,
  EXAMPLE_WEDDING_ID,
  FIXTURE_VIEWER_USER_ID,
  MAX_WORKSPACE_COOKIE_LENGTH,
  parseWorkspaceState,
  serializeWorkspaceState,
  workspaceStateSchema,
} from "./state";

const NOW = new Date("2026-09-21T15:00:00.000Z");
const OTHER_USER = "22222222-2222-4222-8222-222222222222";

describe("workspace fixture state", () => {
  it("drops a corrupt cookie instead of throwing", () => {
    const empty = parseWorkspaceState("%7Bnot-json");
    expect(empty.weddings).toEqual([]);
    expect(empty.profileNames[FIXTURE_VIEWER_USER_ID]).toBe("Camille Laurent");
  });

  it("round-trips a valid snapshot", () => {
    const example = createExampleWorkspaceState(NOW);
    expect(workspaceStateSchema.safeParse(example).success).toBe(true);
    const raw = serializeWorkspaceState(example);
    expect(raw.length).toBeLessThan(MAX_WORKSPACE_COOKIE_LENGTH);
    expect(parseWorkspaceState(raw).weddings[0]?.id).toBe(EXAMPLE_WEDDING_ID);
  });
});

describe("memory wedding repository", () => {
  it("creates an owner membership and does not invent a partner member", () => {
    const created = applyCreateWedding(
      createEmptyWorkspaceState(),
      FIXTURE_VIEWER_USER_ID,
      {
        title: "Camille & Julien",
        partnerName: "Julien Morel",
        weddingDate: "2027-06-12",
        timezone: "America/Toronto",
        currency: "CAD",
      },
      NOW,
      () => "55555555-5555-4555-8555-555555555555",
    );
    expect(created.state.members).toHaveLength(1);
    expect(created.state.members[0]?.role).toBe("owner");
    expect(created.state.members.some((member) => member.role === "partner")).toBe(
      false,
    );
    expect(created.value.partnerDisplayName).toBe("Julien Morel");
    expect(
      readSummaryForUser(
        created.state,
        FIXTURE_VIEWER_USER_ID,
        created.value.wedding.id,
        NOW,
      )?.progress.percent,
    ).toBe(20);
  });

  it("hides another user's wedding and refuses their update", () => {
    const example = createExampleWorkspaceState(NOW);
    const hidden = applyCreateWedding(
      example,
      OTHER_USER,
      {
        title: "Mariage privé",
        partnerName: null,
        weddingDate: null,
        timezone: "America/Toronto",
        currency: "CAD",
      },
      NOW,
      (() => {
        const ids = [
          "66666666-6666-4666-8666-666666666666",
          "77777777-7777-4777-8777-777777777777",
        ];
        return () => {
          const id = ids.shift();
          if (!id) throw new Error("missing id");
          return id;
        };
      })(),
    );

    const repo = createMemoryWeddingRepository(hidden.state, { now: () => NOW });
    return repo.listWeddings(FIXTURE_VIEWER_USER_ID).then(async (visible) => {
      expect(visible.map((wedding) => wedding.title)).toEqual(["Camille & Julien"]);
      expect(
        await repo.getCurrent(FIXTURE_VIEWER_USER_ID, hidden.value.wedding.id),
      ).toBeNull();
      const before = repo.debugState();
      expect(
        await repo.updateWedding(FIXTURE_VIEWER_USER_ID, hidden.value.wedding.id, {
          title: "Piraté",
          partnerName: null,
          weddingDate: null,
          timezone: "UTC",
          currency: "EUR",
        }),
      ).toBeNull();
      expect(repo.debugState()).toEqual(before);
    });
  });

  it("scores the example fixture at 66 percent", async () => {
    const repo = createMemoryWeddingRepository(createExampleWorkspaceState(NOW), {
      now: () => NOW,
    });
    const summary = await repo.getSummary(FIXTURE_VIEWER_USER_ID, EXAMPLE_WEDDING_ID);
    expect(summary?.progress.percent).toBe(66);
    expect(summary?.guestCount).toBe(12);
    expect(summary?.rsvpCount).toBe(5);
  });
});
