import type {
  GuestListItem,
  GuestSide,
  InvitationStatus,
  RsvpStatus,
} from "@/features/guests/domain/types";

export type GuestListQuery = {
  search: string;
  rsvpStatus: RsvpStatus | "all";
  invitationStatus: InvitationStatus | "all";
  side: GuestSide | "all";
  groupLabel: string | "all";
  householdId: string | "all" | "none";
  sort: "name" | "rsvp";
};

export const defaultGuestListQuery: GuestListQuery = {
  search: "",
  rsvpStatus: "all",
  invitationStatus: "all",
  side: "all",
  groupLabel: "all",
  householdId: "all",
  sort: "name",
};

const collator = new Intl.Collator("fr", { sensitivity: "base" });

const RSVP_ORDER: Record<RsvpStatus, number> = {
  attending: 0,
  pending: 1,
  declined: 2,
};

export function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
}

export function filterGuests(guests: GuestListItem[], query: GuestListQuery) {
  const needle = foldText(query.search.trim());
  const filtered = guests.filter((guest) => {
    if (query.rsvpStatus !== "all" && guest.rsvpStatus !== query.rsvpStatus) {
      return false;
    }
    if (
      query.invitationStatus !== "all" &&
      guest.invitationStatus !== query.invitationStatus
    ) {
      return false;
    }
    if (query.side !== "all" && guest.side !== query.side) return false;
    if (query.groupLabel !== "all" && guest.groupLabel !== query.groupLabel) {
      return false;
    }
    if (query.householdId === "none" && guest.householdId) return false;
    if (
      query.householdId !== "all" &&
      query.householdId !== "none" &&
      guest.householdId !== query.householdId
    ) {
      return false;
    }
    if (!needle) return true;
    const haystack = foldText(
      [
        guest.firstName,
        guest.lastName,
        `${guest.firstName} ${guest.lastName}`,
        guest.email ?? "",
        guest.groupLabel ?? "",
        guest.householdName ?? "",
      ].join(" "),
    );
    return haystack.includes(needle);
  });

  return filtered.sort((a, b) => {
    if (query.sort === "rsvp") {
      const byStatus = RSVP_ORDER[a.rsvpStatus] - RSVP_ORDER[b.rsvpStatus];
      if (byStatus !== 0) return byStatus;
    }
    const byLast = collator.compare(a.lastName, b.lastName);
    if (byLast !== 0) return byLast;
    return collator.compare(a.firstName, b.firstName);
  });
}

export function groupOptions(guests: GuestListItem[]) {
  return [...new Set(guests.map((guest) => guest.groupLabel).filter(Boolean) as string[])].sort(
    (a, b) => collator.compare(a, b),
  );
}
