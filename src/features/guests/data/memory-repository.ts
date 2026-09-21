import { randomUUID } from "node:crypto";

import {
  fixtureGuests,
  fixtureHouseholds,
  fixtureInvitations,
  fixtureRsvps,
  fixtureWedding,
} from "@/features/guests/data/fixtures";
import { hashInvitationToken, tokenHashesEqual } from "@/features/guests/data/token-hash";
import type {
  ConfirmationResult,
  DeleteGuestResult,
  GuestRepository,
  PublicRsvpResult,
  SaveGuestResult,
  SaveHouseholdResult,
  SubmitRsvpResult,
} from "@/features/guests/data/repository";
import { buildRsvpDashboard } from "@/features/guests/domain/rsvp-summary";
import { normalizePlusOne, normalizePlusOneAttendance } from "@/features/guests/domain/plus-one";
import {
  normalizePublicSubmission,
  PUBLIC_LINK_MESSAGE,
  validatePublicSubmission,
} from "@/features/guests/domain/public-rsvp";
import type {
  Guest,
  GuestDetail,
  GuestListItem,
  GuestWriteInput,
  Household,
  HouseholdListItem,
  Invitation,
  InvitationSummary,
  PublicRsvpSubmission,
  RSVP,
  RSVPAnswer,
  RsvpConfirmation,
  WeddingGuestScope,
} from "@/features/guests/domain/types";

export type GuestStore = {
  wedding: WeddingGuestScope;
  households: Household[];
  guests: Guest[];
  invitations: Invitation[];
  rsvps: RSVP[];
};

export function createDemoStore(): GuestStore {
  return {
    wedding: structuredClone(fixtureWedding),
    households: structuredClone(fixtureHouseholds),
    guests: structuredClone(fixtureGuests),
    invitations: structuredClone(fixtureInvitations),
    rsvps: structuredClone(fixtureRsvps),
  };
}

export function createEmptyStore(): GuestStore {
  return {
    wedding: structuredClone(fixtureWedding),
    households: [],
    guests: [],
    invitations: [],
    rsvps: [],
  };
}

function invitationStatus(invitation: Invitation, now = Date.now()): InvitationSummary["status"] {
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt && Date.parse(invitation.expiresAt) <= now) return "expired";
  return "active";
}

export function classifyToken(store: GuestStore, token: string) {
  const match = findInvitation(store, token);
  if (!match) return "unknown" as const;
  return invitationStatus(match);
}

function findInvitation(store: GuestStore, token: string) {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 256) return null;
  const hash = hashInvitationToken(trimmed);
  return (
    store.invitations.find((invitation) => tokenHashesEqual(invitation.tokenHash, hash)) ??
    null
  );
}

function activeInvitation(store: GuestStore, token: string) {
  const invitation = findInvitation(store, token);
  if (!invitation) return null;
  if (invitationStatus(invitation) !== "active") return null;
  return invitation;
}

function householdName(store: GuestStore, householdId: string | null) {
  if (!householdId) return null;
  return store.households.find((household) => household.id === householdId)?.name ?? null;
}

function toListItem(store: GuestStore, guest: Guest): GuestListItem {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    groupLabel: guest.groupLabel,
    householdId: guest.householdId,
    householdName: householdName(store, guest.householdId),
    side: guest.side,
    isChild: guest.isChild,
    plusOne: guest.plusOne,
    invitationStatus: guest.invitationStatus,
    rsvpStatus: guest.rsvpStatus,
    mealChoice: guest.mealChoice,
    dietary: guest.dietary,
    eventIds: guest.eventIds,
  };
}

function toDetail(store: GuestStore, guest: Guest): GuestDetail {
  const rsvp = store.rsvps.find((item) => item.guestId === guest.id) ?? null;
  return {
    ...guest,
    invitations: store.invitations
      .filter((invitation) => invitation.guestId === guest.id)
      .map((invitation) => ({
        id: invitation.id,
        status: invitationStatus(invitation),
        expiresAt: invitation.expiresAt,
      })),
    latestRsvp: rsvp
      ? {
          plusOneAttending: rsvp.plusOneAttending,
          plusOneMealChoice: rsvp.plusOneMealChoice,
          message: rsvp.message,
          source: rsvp.source,
          submittedAt: rsvp.submittedAt,
          answers: rsvp.answers,
        }
      : null,
  };
}

function formatEventWhen(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function invalidLink(): { ok: false; message: string; fieldErrors: Record<string, never> } {
  return { ok: false, message: PUBLIC_LINK_MESSAGE, fieldErrors: {} };
}

function scopedGuest(store: GuestStore, slug: string, token: string) {
  if (slug !== store.wedding.slug) return null;
  const invitation = activeInvitation(store, token);
  if (!invitation) return null;
  const guest = store.guests.find((item) => item.id === invitation.guestId);
  if (!guest || guest.weddingId !== invitation.weddingId) return null;
  return { invitation, guest };
}

function confirmationFrom(
  store: GuestStore,
  guest: Guest,
  rsvp: RSVP,
): RsvpConfirmation {
  const eventsAttending = rsvp.answers
    .filter((answer) => answer.attending)
    .flatMap((answer) => {
      const event = store.wedding.events.find((item) => item.id === answer.eventId);
      return event ? [{ id: event.id, name: event.name }] : [];
    });
  return {
    weddingTitle: store.wedding.title,
    guestFirstName: guest.firstName,
    status: rsvp.status === "declined" ? "declined" : "attending",
    plusOneName: rsvp.plusOneAttending ? rsvp.plusOneName : null,
    plusOneMealChoice: rsvp.plusOneAttending ? rsvp.plusOneMealChoice : "unset",
    mealChoice: rsvp.mealChoice,
    dietary: rsvp.dietary,
    eventsAttending,
    message: rsvp.message,
  };
}

function upsertRsvp(
  store: GuestStore,
  guest: Guest,
  patch: Omit<RSVP, "id" | "weddingId" | "guestId">,
) {
  const existing = store.rsvps.find((item) => item.guestId === guest.id);
  if (existing) {
    Object.assign(existing, patch);
    return existing;
  }
  const created: RSVP = {
    id: `rsvp_${randomUUID()}`,
    weddingId: guest.weddingId,
    guestId: guest.id,
    ...patch,
  };
  store.rsvps.push(created);
  return created;
}

export function createMemoryRepository(store: GuestStore): GuestRepository {
  return {
    async getWedding(weddingId) {
      return weddingId === store.wedding.id ? store.wedding : null;
    },

    async listGuests(weddingId) {
      if (weddingId !== store.wedding.id) return [];
      return store.guests.map((guest) => toListItem(store, guest));
    },

    async getGuest(weddingId, guestId) {
      if (weddingId !== store.wedding.id) return null;
      const guest = store.guests.find((item) => item.id === guestId);
      return guest ? toDetail(store, guest) : null;
    },

    async saveGuest(weddingId, input): Promise<SaveGuestResult> {
      if (weddingId !== store.wedding.id) {
        return { ok: false, message: "Mariage introuvable.", fieldErrors: {} };
      }
      if (
        input.householdId &&
        !store.households.some((household) => household.id === input.householdId)
      ) {
        return {
          ok: false,
          message: "Ce foyer n'appartient pas au mariage.",
          fieldErrors: { householdId: "Choisissez un foyer de ce mariage." },
        };
      }
      const knownEvents = new Set(store.wedding.events.map((event) => event.id));
      if (input.eventIds.some((eventId) => !knownEvents.has(eventId))) {
        return {
          ok: false,
          message: "Un événement n'appartient pas au mariage.",
          fieldErrors: { eventIds: "Retirez les événements inconnus." },
        };
      }

      const plusOne = normalizePlusOne({
        allowed: input.plusOneAllowed,
        name: input.plusOneName,
        guestId: null,
      });
      const attendance = normalizePlusOneAttendance({
        allowed: plusOne.allowed,
        guestAttending: input.rsvpStatus === "attending",
        plusOneAttending: input.plusOneAttending,
        plusOneName: plusOne.name,
        plusOneMealChoice: input.plusOneMealChoice,
      });

      const now = new Date().toISOString();
      let guest = input.id
        ? store.guests.find((item) => item.id === input.id)
        : undefined;
      if (input.id && !guest) {
        return { ok: false, message: "Cet invité est introuvable.", fieldErrors: {} };
      }

      if (!guest) {
        guest = {
          id: `gst_${randomUUID()}`,
          weddingId,
          householdId: input.householdId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          groupLabel: input.groupLabel,
          side: input.side,
          isChild: input.isChild,
          plusOne,
          invitationStatus: input.invitationStatus,
          rsvpStatus: input.rsvpStatus,
          mealChoice: input.mealChoice,
          dietary: input.dietary,
          dietaryNote: input.dietaryNote,
          allergies: input.allergies,
          privateNotes: input.privateNotes,
          eventIds: input.eventIds,
          updatedAt: now,
        };
        store.guests.push(guest);
      } else {
        guest.householdId = input.householdId;
        guest.firstName = input.firstName;
        guest.lastName = input.lastName;
        guest.email = input.email;
        guest.phone = input.phone;
        guest.groupLabel = input.groupLabel;
        guest.side = input.side;
        guest.isChild = input.isChild;
        guest.plusOne = plusOne;
        guest.invitationStatus = input.invitationStatus;
        guest.rsvpStatus = input.rsvpStatus;
        guest.mealChoice = input.mealChoice;
        guest.dietary = input.dietary;
        guest.dietaryNote = input.dietaryNote;
        guest.allergies = input.allergies;
        guest.privateNotes = input.privateNotes;
        guest.eventIds = input.eventIds;
        guest.updatedAt = now;
      }

      const existing = store.rsvps.find((item) => item.guestId === guest.id);
      const answers = syncAnswers(
        existing?.answers ?? [],
        guest,
        input.rsvpStatus,
        existing?.status === input.rsvpStatus,
      );
      if (input.rsvpStatus === "pending" && !existing) {
        return { ok: true, guest: toDetail(store, guest) };
      }
      upsertRsvp(store, guest, {
        invitationId: existing?.invitationId ?? null,
        status: input.rsvpStatus,
        source: existing?.source ?? "couple",
        plusOneAttending: attendance.plusOneAttending,
        plusOneName: attendance.plusOneAttending ? attendance.plusOneName : plusOne.name,
        plusOneMealChoice: attendance.plusOneMealChoice,
        mealChoice: input.mealChoice,
        dietary: input.dietary,
        dietaryNote: input.dietaryNote,
        allergies: input.allergies,
        message: existing?.message ?? null,
        submittedAt:
          input.rsvpStatus === "pending"
            ? (existing?.submittedAt ?? null)
            : (existing?.submittedAt ?? now),
        answers,
      });
      return { ok: true, guest: toDetail(store, guest) };
    },

    async deleteGuest(weddingId, guestId): Promise<DeleteGuestResult> {
      if (weddingId !== store.wedding.id) {
        return { ok: false, message: "Mariage introuvable." };
      }
      const index = store.guests.findIndex((guest) => guest.id === guestId);
      if (index === -1) return { ok: false, message: "Cet invité est introuvable." };
      store.guests.splice(index, 1);
      store.invitations = store.invitations.filter((item) => item.guestId !== guestId);
      store.rsvps = store.rsvps.filter((item) => item.guestId !== guestId);
      return { ok: true };
    },

    async listHouseholds(weddingId) {
      if (weddingId !== store.wedding.id) return [];
      return store.households.map((household) => toHousehold(store, household));
    },

    async saveHousehold(weddingId, input): Promise<SaveHouseholdResult> {
      if (weddingId !== store.wedding.id) {
        return { ok: false, message: "Mariage introuvable.", fieldErrors: {} };
      }
      if (input.id) {
        const household = store.households.find((item) => item.id === input.id);
        if (!household) {
          return { ok: false, message: "Ce foyer est introuvable.", fieldErrors: {} };
        }
        household.name = input.name;
        household.address = input.address;
        return { ok: true, household: toHousehold(store, household) };
      }
      const household: Household = {
        id: `hh_${randomUUID()}`,
        weddingId,
        name: input.name,
        address: input.address,
      };
      store.households.push(household);
      return { ok: true, household: toHousehold(store, household) };
    },

    async getRsvpDashboard(weddingId) {
      if (weddingId !== store.wedding.id) return null;
      return buildRsvpDashboard({
        guests: store.guests,
        rsvps: store.rsvps,
        events: store.wedding.events,
      });
    },

    async getPublicRsvp(slug, token): Promise<PublicRsvpResult> {
      const scoped = scopedGuest(store, slug, token);
      if (!scoped) return { ok: false, message: PUBLIC_LINK_MESSAGE };
      const { guest } = scoped;
      const rsvp = store.rsvps.find((item) => item.guestId === guest.id) ?? null;
      const events = store.wedding.events.filter((event) => guest.eventIds.includes(event.id));
      return {
        ok: true,
        view: {
          weddingTitle: store.wedding.title,
          guestFirstName: guest.firstName,
          plusOneAllowed: guest.plusOne.allowed,
          events: events.map((event) => ({
            id: event.id,
            name: event.name,
            whenLabel: formatEventWhen(event.startsAt),
          })),
          defaults: {
            status:
              rsvp && (rsvp.status === "attending" || rsvp.status === "declined")
                ? rsvp.status
                : "",
            attendingEventIds:
              rsvp?.answers.filter((answer) => answer.attending).map((answer) => answer.eventId) ??
              [],
            plusOneAttending: rsvp?.plusOneAttending ?? false,
            plusOneName: rsvp?.plusOneName ?? guest.plusOne.name ?? "",
            plusOneMealChoice: rsvp?.plusOneMealChoice ?? "unset",
            mealChoice: rsvp?.mealChoice ?? guest.mealChoice,
            dietary: rsvp?.dietary ?? guest.dietary,
            dietaryNote: rsvp?.dietaryNote ?? guest.dietaryNote ?? "",
            allergies: rsvp?.allergies ?? guest.allergies ?? "",
            message: rsvp?.message ?? "",
          },
        },
      };
    },

    async submitPublicRsvp(slug, token, input): Promise<SubmitRsvpResult> {
      const scoped = scopedGuest(store, slug, token);
      if (!scoped) return invalidLink();
      const fieldErrors = validatePublicSubmission(input, {
        plusOneAllowed: scoped.guest.plusOne.allowed,
        eventIds: scoped.guest.eventIds,
      });
      if (Object.keys(fieldErrors).length > 0) {
        return {
          ok: false,
          message: "La réponse ne peut pas être enregistrée.",
          fieldErrors,
        };
      }
      const normalized = normalizePublicSubmission(input, {
        plusOneAllowed: scoped.guest.plusOne.allowed,
        eventIds: scoped.guest.eventIds,
      });
      applyPublicRsvp(store, scoped.guest, scoped.invitation.id, normalized);
      const rsvp = store.rsvps.find((item) => item.guestId === scoped.guest.id)!;
      return { ok: true, confirmation: confirmationFrom(store, scoped.guest, rsvp) };
    },

    async getRsvpConfirmation(slug, token): Promise<ConfirmationResult> {
      const scoped = scopedGuest(store, slug, token);
      if (!scoped) return { ok: false, message: PUBLIC_LINK_MESSAGE };
      const rsvp = store.rsvps.find((item) => item.guestId === scoped.guest.id) ?? null;
      const answered = rsvp && (rsvp.status === "attending" || rsvp.status === "declined");
      return {
        ok: true,
        weddingTitle: store.wedding.title,
        guestFirstName: scoped.guest.firstName,
        confirmation: answered ? confirmationFrom(store, scoped.guest, rsvp) : null,
      };
    },
  };
}

function toHousehold(store: GuestStore, household: Household): HouseholdListItem {
  return {
    ...household,
    members: store.guests
      .filter((guest) => guest.householdId === household.id)
      .map((guest) => ({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
      })),
  };
}

function syncAnswers(
  previous: RSVPAnswer[],
  guest: Guest,
  status: GuestWriteInput["rsvpStatus"],
  preserve: boolean,
): RSVPAnswer[] {
  return guest.eventIds.map((eventId) => {
    const existing = previous.find((answer) => answer.eventId === eventId);
    if (existing && (preserve || status === "pending")) return existing;
    return {
      id: existing?.id ?? `ans_${randomUUID()}`,
      rsvpId: existing?.rsvpId ?? "",
      eventId,
      attending: status === "attending",
    };
  });
}

function applyPublicRsvp(
  store: GuestStore,
  guest: Guest,
  invitationId: string,
  input: PublicRsvpSubmission,
) {
  const now = new Date().toISOString();
  const existing = store.rsvps.find((item) => item.guestId === guest.id);
  const answers: RSVPAnswer[] = guest.eventIds.map((eventId) => ({
    id:
      existing?.answers.find((answer) => answer.eventId === eventId)?.id ??
      `ans_${randomUUID()}`,
    rsvpId: existing?.id ?? "",
    eventId,
    attending: input.status === "attending" && input.attendingEventIds.includes(eventId),
  }));

  const rsvp = upsertRsvp(store, guest, {
    invitationId,
    status: input.status,
    source: "guest",
    plusOneAttending: input.plusOneAttending,
    plusOneName: input.plusOneName,
    plusOneMealChoice: input.plusOneMealChoice,
    mealChoice: input.mealChoice,
    dietary: input.dietary,
    dietaryNote: input.dietaryNote,
    allergies: input.allergies,
    message: input.message,
    submittedAt: now,
    answers,
  });
  for (const answer of rsvp.answers) answer.rsvpId = rsvp.id;

  guest.rsvpStatus = input.status;
  guest.updatedAt = now;
  if (input.status === "attending") {
    guest.mealChoice = input.mealChoice;
    guest.dietary = input.dietary;
    guest.dietaryNote = input.dietaryNote;
    guest.allergies = input.allergies;
    if (guest.plusOne.allowed) {
      guest.plusOne = {
        ...guest.plusOne,
        name: input.plusOneAttending ? input.plusOneName : guest.plusOne.name,
      };
    }
  }
}
