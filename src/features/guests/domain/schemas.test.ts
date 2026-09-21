import { describe, expect, it } from "vitest";

import { guestWriteSchema, publicRsvpSchema } from "@/features/guests/domain/schemas";
import { normalizePlusOne } from "@/features/guests/domain/plus-one";
import {
  normalizePublicSubmission,
  validatePublicSubmission,
} from "@/features/guests/domain/public-rsvp";

const guestBase = {
  id: "",
  firstName: "Léa",
  lastName: "Martin",
  email: "",
  phone: "",
  householdId: "",
  groupLabel: "",
  side: "partner_a",
  isChild: false,
  plusOneAllowed: false,
  plusOneName: "",
  plusOneAttending: false,
  plusOneMealChoice: "unset",
  invitationStatus: "invited",
  rsvpStatus: "pending",
  mealChoice: "unset",
  dietary: [],
  dietaryNote: "",
  allergies: "",
  privateNotes: "",
  eventIds: ["evt-ceremony"],
};

describe("guestWriteSchema", () => {
  it("accepts a minimal guest and clears an empty email", () => {
    const parsed = guestWriteSchema.safeParse(guestBase);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBeNull();
  });

  it("rejects a plus-one name when none is allowed", () => {
    const parsed = guestWriteSchema.safeParse({
      ...guestBase,
      plusOneName: "Alex",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects confirming a plus-one while the guest is still pending", () => {
    const parsed = guestWriteSchema.safeParse({
      ...guestBase,
      plusOneAllowed: true,
      plusOneAttending: true,
      rsvpStatus: "pending",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("public RSVP rules", () => {
  it("requires a status", () => {
    const parsed = publicRsvpSchema.safeParse({
      status: "",
      attendingEventIds: [],
      plusOneAttending: false,
      plusOneName: "",
      plusOneMealChoice: "unset",
      mealChoice: "unset",
      dietary: [],
      dietaryNote: "",
      allergies: "",
      message: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("blocks a plus-one when the invitation does not allow one", () => {
    const errors = validatePublicSubmission(
      {
        status: "attending",
        attendingEventIds: ["evt-ceremony"],
        plusOneAttending: true,
        plusOneName: "Alex",
        plusOneMealChoice: "fish",
        mealChoice: "fish",
        dietary: [],
        dietaryNote: null,
        allergies: null,
        message: null,
      },
      { plusOneAllowed: false, eventIds: ["evt-ceremony"] },
    );
    expect(errors.plusOneAttending).toBeTruthy();
  });

  it("drops meal and plus-one details when the guest declines", () => {
    const normalized = normalizePublicSubmission(
      {
        status: "declined",
        attendingEventIds: ["evt-ceremony"],
        plusOneAttending: false,
        plusOneName: "Alex",
        plusOneMealChoice: "fish",
        mealChoice: "fish",
        dietary: ["gluten_free"],
        dietaryNote: "note",
        allergies: "pollen",
        message: "Désolée",
      },
      { plusOneAllowed: true, eventIds: ["evt-ceremony"] },
    );
    expect(normalized.mealChoice).toBe("unset");
    expect(normalized.dietary).toEqual([]);
    expect(normalized.message).toBe("Désolée");
    expect(normalized.plusOneName).toBeNull();
  });
});

describe("normalizePlusOne", () => {
  it("drops the name and any linked guest when the plus-one is not allowed", () => {
    expect(
      normalizePlusOne({ allowed: false, name: "Alex", guestId: "gst-x" }),
    ).toEqual({ allowed: false, name: null, guestId: null });
  });
});
