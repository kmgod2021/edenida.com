import type { FieldErrors } from "@/features/guests/domain/form-state";
import { normalizePlusOneAttendance } from "@/features/guests/domain/plus-one";
import type { PublicRsvpSubmission } from "@/features/guests/domain/types";

export const PUBLIC_LINK_MESSAGE =
  "Ce lien d'invitation n'est pas valide. Demandez un nouveau lien aux mariés.";

export type PublicGuestConstraints = {
  plusOneAllowed: boolean;
  eventIds: string[];
};

export function validatePublicSubmission(
  input: PublicRsvpSubmission,
  guest: PublicGuestConstraints,
): FieldErrors {
  const fieldErrors: FieldErrors = {};
  const unknownEvents = input.attendingEventIds.filter(
    (eventId) => !guest.eventIds.includes(eventId),
  );
  if (unknownEvents.length > 0) {
    fieldErrors.attendingEventIds = "Un événement indiqué n'est pas invité.";
  }
  if (!guest.plusOneAllowed && (input.plusOneAttending || input.plusOneName)) {
    fieldErrors.plusOneAttending = "Aucun accompagnant n'est prévu pour cette invitation.";
  }
  if (input.status === "declined" && input.plusOneAttending) {
    fieldErrors.plusOneAttending =
      "Un accompagnant ne peut pas être confirmé si vous déclinez.";
  }
  return fieldErrors;
}

export function normalizePublicSubmission(
  input: PublicRsvpSubmission,
  guest: PublicGuestConstraints,
): PublicRsvpSubmission {
  if (input.status === "declined") {
    return {
      status: "declined",
      attendingEventIds: [],
      plusOneAttending: false,
      plusOneName: null,
      plusOneMealChoice: "unset",
      mealChoice: "unset",
      dietary: [],
      dietaryNote: null,
      allergies: null,
      message: input.message,
    };
  }

  const plusOne = normalizePlusOneAttendance({
    allowed: guest.plusOneAllowed,
    guestAttending: true,
    plusOneAttending: input.plusOneAttending,
    plusOneName: input.plusOneName,
    plusOneMealChoice: input.plusOneMealChoice,
  });

  return {
    ...input,
    attendingEventIds: input.attendingEventIds.filter((eventId) =>
      guest.eventIds.includes(eventId),
    ),
    plusOneAttending: plusOne.plusOneAttending,
    plusOneName: plusOne.plusOneName,
    plusOneMealChoice: plusOne.plusOneMealChoice,
  };
}
