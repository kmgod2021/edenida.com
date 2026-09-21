import { describe, expect, it } from "vitest";

import { filterGuests, foldText } from "@/features/guests/domain/guest-filters";
import type { GuestListItem } from "@/features/guests/domain/types";

function guest(overrides: Partial<GuestListItem> & Pick<GuestListItem, "id" | "firstName" | "lastName">): GuestListItem {
  return {
    email: null,
    groupLabel: null,
    householdId: null,
    householdName: null,
    side: "unspecified",
    isChild: false,
    plusOne: { allowed: false, name: null, guestId: null },
    invitationStatus: "invited",
    rsvpStatus: "pending",
    mealChoice: "unset",
    dietary: [],
    eventIds: [],
    ...overrides,
  };
}

const people = [
  guest({
    id: "1",
    firstName: "Léa",
    lastName: "Martin",
    email: "lea.martin@example.com",
    householdId: "hh-martin",
    householdName: "Famille Martin",
    groupLabel: "Famille",
    side: "partner_a",
    rsvpStatus: "pending",
  }),
  guest({
    id: "2",
    firstName: "Samir",
    lastName: "Diallo",
    householdId: "hh-diallo",
    householdName: "Famille Diallo",
    side: "partner_b",
    rsvpStatus: "declined",
  }),
  guest({
    id: "3",
    firstName: "Noah",
    lastName: "Petit",
    side: "partner_a",
    rsvpStatus: "attending",
    isChild: true,
  }),
];

describe("filterGuests", () => {
  it("matches names without accents", () => {
    expect(foldText("Léa")).toBe("lea");
    const found = filterGuests(people, {
      search: "lea",
      rsvpStatus: "all",
      invitationStatus: "all",
      side: "all",
      groupLabel: "all",
      householdId: "all",
      sort: "name",
    });
    expect(found.map((item) => item.id)).toEqual(["1"]);
  });

  it("filters by RSVP, side, household, and group", () => {
    const declined = filterGuests(people, {
      search: "",
      rsvpStatus: "declined",
      invitationStatus: "all",
      side: "all",
      groupLabel: "all",
      householdId: "all",
      sort: "name",
    });
    expect(declined.map((item) => item.firstName)).toEqual(["Samir"]);

    const side = filterGuests(people, {
      search: "",
      rsvpStatus: "all",
      invitationStatus: "all",
      side: "partner_b",
      groupLabel: "all",
      householdId: "all",
      sort: "name",
    });
    expect(side.map((item) => item.id)).toEqual(["2"]);

    const none = filterGuests(people, {
      search: "",
      rsvpStatus: "all",
      invitationStatus: "all",
      side: "all",
      groupLabel: "all",
      householdId: "none",
      sort: "name",
    });
    expect(none.map((item) => item.firstName)).toEqual(["Noah"]);
  });

  it("sorts attending before pending before declined when requested", () => {
    const sorted = filterGuests(people, {
      search: "",
      rsvpStatus: "all",
      invitationStatus: "all",
      side: "all",
      groupLabel: "all",
      householdId: "all",
      sort: "rsvp",
    });
    expect(sorted.map((item) => item.rsvpStatus)).toEqual(["attending", "pending", "declined"]);
  });
});
