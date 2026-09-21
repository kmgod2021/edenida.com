import type {
  DietaryRestriction,
  GuestSide,
  InvitationStatus,
  MealChoice,
  RsvpStatus,
  WeddingGuestScope,
} from "@/features/guests/domain/types";

export function guestName(guest: { firstName: string; lastName: string }) {
  return `${guest.firstName} ${guest.lastName}`;
}

export function sideLabel(
  side: GuestSide,
  wedding: Pick<WeddingGuestScope, "partnerAName" | "partnerBName">,
) {
  switch (side) {
    case "partner_a":
      return `Côté ${wedding.partnerAName}`;
    case "partner_b":
      return `Côté ${wedding.partnerBName}`;
    case "both":
      return "Les deux";
    case "unspecified":
      return "Non précisé";
  }
}

export function invitationStatusLabel(status: InvitationStatus) {
  switch (status) {
    case "not_invited":
      return "Non invité";
    case "save_the_date":
      return "Save the date";
    case "invited":
      return "Invité";
  }
}

export function rsvpStatusLabel(status: RsvpStatus) {
  switch (status) {
    case "pending":
      return "En attente";
    case "attending":
      return "Présent";
    case "declined":
      return "Absent";
  }
}

export function mealLabel(choice: MealChoice) {
  switch (choice) {
    case "unset":
      return "Non précisé";
    case "meat":
      return "Viande";
    case "fish":
      return "Poisson";
    case "vegetarian":
      return "Végétarien";
    case "vegan":
      return "Végan";
    case "child":
      return "Menu enfant";
  }
}

export function dietaryLabel(restriction: DietaryRestriction) {
  switch (restriction) {
    case "vegetarian":
      return "Régime végétarien";
    case "vegan":
      return "Régime végan";
    case "gluten_free":
      return "Sans gluten";
    case "lactose_free":
      return "Sans lactose";
    case "halal":
      return "Halal";
    case "kosher":
      return "Casher";
    case "other":
      return "Autre";
  }
}

export function invitationLinkLabel(status: "active" | "expired" | "revoked") {
  switch (status) {
    case "active":
      return "Lien actif";
    case "expired":
      return "Lien expiré";
    case "revoked":
      return "Lien révoqué";
  }
}

export function countNoun(count: number, singular: string, plural: string) {
  return `${count} ${count > 1 ? plural : singular}`;
}
