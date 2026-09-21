import { z } from "zod";

import {
  DIETARY_RESTRICTIONS,
  GUEST_SIDES,
  INVITATION_STATUSES,
  MEAL_CHOICES,
  RSVP_STATUSES,
} from "@/features/guests/domain/types";

function emptyToNull(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Maximum ${max} caractères`)
    .transform((value) => (value.length === 0 ? null : value));
}

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.union([
    z.literal("").transform(() => null),
    z.email("Adresse e-mail invalide"),
  ]),
);

const idSchema = z
  .string()
  .trim()
  .max(80)
  .transform((value) => (value.length === 0 ? null : value));

function uniqueEnums<T extends string>(values: readonly T[]) {
  return z
    .array(z.enum(values))
    .max(20)
    .transform((items) => [...new Set(items)]);
}

export const guestWriteSchema = z
  .object({
    id: idSchema,
    firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
    lastName: z.string().trim().min(1, "Le nom est requis").max(80),
    email: optionalEmail,
    phone: emptyToNull(40),
    householdId: idSchema,
    groupLabel: emptyToNull(80),
    side: z.enum(GUEST_SIDES),
    isChild: z.boolean(),
    plusOneAllowed: z.boolean(),
    plusOneName: emptyToNull(80),
    plusOneAttending: z.boolean(),
    plusOneMealChoice: z.enum(MEAL_CHOICES),
    invitationStatus: z.enum(INVITATION_STATUSES),
    rsvpStatus: z.enum(RSVP_STATUSES),
    mealChoice: z.enum(MEAL_CHOICES),
    dietary: uniqueEnums(DIETARY_RESTRICTIONS),
    dietaryNote: emptyToNull(240),
    allergies: emptyToNull(240),
    privateNotes: emptyToNull(2000),
    eventIds: z
      .array(z.string().trim().min(1).max(80))
      .max(20)
      .transform((ids) => [...new Set(ids)]),
  })
  .superRefine((value, ctx) => {
    if (!value.plusOneAllowed && value.plusOneName) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneName"],
        message: "Autorisez le plus-one avant d'indiquer un nom.",
      });
    }
    if (!value.plusOneAllowed && value.plusOneAttending) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneAttending"],
        message: "Autorisez le plus-one avant de le marquer présent.",
      });
    }
    if (value.plusOneAttending && value.rsvpStatus !== "attending") {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneAttending"],
        message: "Passez le statut à Présent pour confirmer l'accompagnant.",
      });
    }
  });

export const householdWriteSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Le nom du foyer est requis").max(120),
  address: emptyToNull(240),
});

export const publicRsvpSchema = z.object({
  status: z.enum(["attending", "declined"], {
    error: "Choisissez une réponse.",
  }),
  attendingEventIds: z
    .array(z.string().trim().min(1).max(80))
    .max(20)
    .transform((ids) => [...new Set(ids)]),
  plusOneAttending: z.boolean(),
  plusOneName: emptyToNull(80),
  plusOneMealChoice: z.enum(MEAL_CHOICES),
  mealChoice: z.enum(MEAL_CHOICES),
  dietary: uniqueEnums(DIETARY_RESTRICTIONS),
  dietaryNote: emptyToNull(240),
  allergies: emptyToNull(240),
  message: emptyToNull(500),
});

export function guestFormValues(formData: FormData) {
  return {
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    householdId: formData.get("householdId"),
    groupLabel: formData.get("groupLabel"),
    side: formData.get("side"),
    isChild: formData.get("isChild") === "true",
    plusOneAllowed: formData.get("plusOneAllowed") === "true",
    plusOneName: formData.get("plusOneName"),
    plusOneAttending: formData.get("plusOneAttending") === "true",
    plusOneMealChoice: formData.get("plusOneMealChoice") || "unset",
    invitationStatus: formData.get("invitationStatus"),
    rsvpStatus: formData.get("rsvpStatus"),
    mealChoice: formData.get("mealChoice") || "unset",
    dietary: formData.getAll("dietary"),
    dietaryNote: formData.get("dietaryNote"),
    allergies: formData.get("allergies"),
    privateNotes: formData.get("privateNotes"),
    eventIds: formData.getAll("eventIds"),
  };
}

export function householdFormValues(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    address: formData.get("address"),
  };
}

export function publicRsvpFormValues(formData: FormData) {
  return {
    status: formData.get("status"),
    attendingEventIds: formData.getAll("attendingEventIds"),
    plusOneAttending: formData.get("plusOneAttending") === "true",
    plusOneName: formData.get("plusOneName"),
    plusOneMealChoice: formData.get("plusOneMealChoice") || "unset",
    mealChoice: formData.get("mealChoice") || "unset",
    dietary: formData.getAll("dietary"),
    dietaryNote: formData.get("dietaryNote"),
    allergies: formData.get("allergies"),
    message: formData.get("message"),
  };
}
