import { beforeEach, describe, expect, it } from "vitest";

import {
  FIXTURE_PRIVATE_NOTE,
  FIXTURE_SLUG,
  FIXTURE_TOKENS,
  FIXTURE_WEDDING_ID,
} from "@/features/guests/data/fixture-tokens";
import { resetGuestStores, getGuestRepository } from "@/features/guests/data/get-repository";
import {
  classifyToken,
  createDemoStore,
  createMemoryRepository,
} from "@/features/guests/data/memory-repository";
import { hashInvitationToken } from "@/features/guests/data/token-hash";
import { PUBLIC_LINK_MESSAGE } from "@/features/guests/domain/public-rsvp";

describe("memory guest repository", () => {
  beforeEach(() => {
    resetGuestStores();
  });

  it("keeps sessions isolated", async () => {
    const a = getGuestRepository({ sessionId: "a", scenario: "demo" });
    const b = getGuestRepository({ sessionId: "b", scenario: "demo" });
    await a.saveGuest(FIXTURE_WEDDING_ID, {
      id: null,
      firstName: "Nina",
      lastName: "Bernard",
      email: null,
      phone: null,
      householdId: null,
      groupLabel: null,
      side: "both",
      isChild: false,
      plusOneAllowed: false,
      plusOneName: null,
      plusOneAttending: false,
      plusOneMealChoice: "unset",
      invitationStatus: "invited",
      rsvpStatus: "pending",
      mealChoice: "unset",
      dietary: [],
      dietaryNote: null,
      allergies: null,
      privateNotes: null,
      eventIds: [],
    });
    const listB = await b.listGuests(FIXTURE_WEDDING_ID);
    expect(listB.some((guest) => guest.firstName === "Nina")).toBe(false);
  });

  it("does not return raw tokens, hashes, or private notes on the public view", async () => {
    const repo = createMemoryRepository(createDemoStore());
    const result = await repo.getPublicRsvp(FIXTURE_SLUG, FIXTURE_TOKENS.lea);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const json = JSON.stringify(result.view);
    expect(json).toContain("Léa");
    expect(json).not.toContain("Awa");
    expect(json).not.toContain("Diallo");
    expect(json).not.toContain(FIXTURE_PRIVATE_NOTE);
    expect(json).not.toContain(FIXTURE_TOKENS.lea);
    expect(json).not.toContain(hashInvitationToken(FIXTURE_TOKENS.lea));
    expect(result.view.plusOneAllowed).toBe(true);
  });

  it("uses the same public message for unknown, expired, revoked, and wrong-slug links", async () => {
    const store = createDemoStore();
    const repo = createMemoryRepository(store);
    expect(classifyToken(store, FIXTURE_TOKENS.expired)).toBe("expired");
    expect(classifyToken(store, FIXTURE_TOKENS.revoked)).toBe("revoked");
    expect(classifyToken(store, "edn_fix_missing_token_value_123456")).toBe("unknown");

    for (const token of [
      FIXTURE_TOKENS.expired,
      FIXTURE_TOKENS.revoked,
      "edn_fix_missing_token_value_123456",
    ]) {
      const result = await repo.getPublicRsvp(FIXTURE_SLUG, token);
      expect(result).toEqual({ ok: false, message: PUBLIC_LINK_MESSAGE });
    }
    const wrongSlug = await repo.getPublicRsvp("autre-mariage", FIXTURE_TOKENS.lea);
    expect(wrongSlug).toEqual({ ok: false, message: PUBLIC_LINK_MESSAGE });
  });

  it("updates the guest and dashboard from one scoped RSVP", async () => {
    const repo = createMemoryRepository(createDemoStore());
    const submitted = await repo.submitPublicRsvp(FIXTURE_SLUG, FIXTURE_TOKENS.lea, {
      status: "attending",
      attendingEventIds: ["evt-ceremony", "evt-reception"],
      plusOneAttending: true,
      plusOneName: "Alex Martin",
      plusOneMealChoice: "vegetarian",
      mealChoice: "fish",
      dietary: ["gluten_free"],
      dietaryNote: null,
      allergies: "pollen",
      message: "Hâte d'y être",
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    expect(submitted.confirmation.guestFirstName).toBe("Léa");
    expect(submitted.confirmation.eventsAttending.map((event) => event.name)).toEqual([
      "Cérémonie",
      "Dîner",
    ]);
    expect(JSON.stringify(submitted.confirmation)).not.toContain("Awa");

    const detail = await repo.getGuest(FIXTURE_WEDDING_ID, "gst-lea");
    expect(detail?.rsvpStatus).toBe("attending");
    expect(detail?.mealChoice).toBe("fish");
    expect(detail?.plusOne.name).toBe("Alex Martin");
    expect(JSON.stringify(detail)).not.toContain(FIXTURE_TOKENS.lea);

    const dashboard = await repo.getRsvpDashboard(FIXTURE_WEDDING_ID);
    expect(dashboard?.attending).toBe(4);
    expect(dashboard?.plusOnesAttending).toBe(1);
    expect(dashboard?.awaiting).toBe(1);
  });

  it("rejects a plus-one for a guest who was not offered one", async () => {
    const repo = createMemoryRepository(createDemoStore());
    const result = await repo.submitPublicRsvp(FIXTURE_SLUG, FIXTURE_TOKENS.marc, {
      status: "attending",
      attendingEventIds: ["evt-ceremony"],
      plusOneAttending: true,
      plusOneName: "Quelqu'un",
      plusOneMealChoice: "meat",
      mealChoice: "meat",
      dietary: [],
      dietaryNote: null,
      allergies: null,
      message: null,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.plusOneAttending).toBeTruthy();
  });

  it("removes invitations and responses when a guest is deleted", async () => {
    const repo = createMemoryRepository(createDemoStore());
    expect((await repo.deleteGuest(FIXTURE_WEDDING_ID, "gst-ines")).ok).toBe(true);
    expect(await repo.getGuest(FIXTURE_WEDDING_ID, "gst-ines")).toBeNull();
    const dashboard = await repo.getRsvpDashboard(FIXTURE_WEDDING_ID);
    expect(dashboard?.notInvited).toBe(0);
  });
});
