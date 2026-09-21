/**
 * Guest-list and RSVP domain contracts for Wave A.
 * Persistence mapping lives in ./docs/persistence-handoff.md.
 * Invitation tokens are a proposal only — see ./docs/rsvp-token-security-proposal.md.
 */

export const GUEST_SIDES = ["partner_a", "partner_b", "both", "unspecified"] as const;
export type GuestSide = (typeof GUEST_SIDES)[number];

export const INVITATION_STATUSES = ["not_invited", "save_the_date", "invited"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const RSVP_STATUSES = ["pending", "attending", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const MEAL_CHOICES = ["unset", "meat", "fish", "vegetarian", "vegan", "child"] as const;
export type MealChoice = (typeof MEAL_CHOICES)[number];

export const DIETARY_RESTRICTIONS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "lactose_free",
  "halal",
  "kosher",
  "other",
] as const;
export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number];

export const RSVP_SOURCES = ["guest", "couple"] as const;
export type RsvpSource = (typeof RSVP_SOURCES)[number];

/** Named or unnamed accompanying seat. Not a second guest row in Wave A. */
export type PlusOne = {
  allowed: boolean;
  name: string | null;
  /**
   * Reserved for a later decision: materialize the plus-one as their own guest.
   * Wave A always stores null here.
   */
  guestId: string | null;
};

export type WeddingEvent = {
  id: string;
  name: string;
  /** ISO-8601. Display timezone is a persistence concern; fixtures use UTC. */
  startsAt: string | null;
};

export type WeddingGuestScope = {
  id: string;
  title: string;
  slug: string;
  partnerAName: string;
  partnerBName: string;
  events: WeddingEvent[];
};

export type Household = {
  id: string;
  weddingId: string;
  name: string;
  address: string | null;
};

export type Guest = {
  id: string;
  weddingId: string;
  householdId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  side: GuestSide;
  isChild: boolean;
  plusOne: PlusOne;
  invitationStatus: InvitationStatus;
  rsvpStatus: RsvpStatus;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  dietaryNote: string | null;
  allergies: string | null;
  /** Couple-only. Never copied onto public RSVP views. */
  privateNotes: string | null;
  eventIds: string[];
  updatedAt: string;
};

/**
 * Invitation credential reference.
 * `tokenHash` is the only stored secret material. The raw token is not a field.
 */
export type Invitation = {
  id: string;
  weddingId: string;
  guestId: string;
  tokenHash: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type InvitationSummary = {
  id: string;
  status: "active" | "expired" | "revoked";
  expiresAt: string | null;
};

/** Per invited event. Meal choice stays on the RSVP, not on each answer. */
export type RSVPAnswer = {
  id: string;
  rsvpId: string;
  eventId: string;
  attending: boolean;
};

export type RSVP = {
  id: string;
  weddingId: string;
  guestId: string;
  invitationId: string | null;
  status: RsvpStatus;
  source: RsvpSource;
  plusOneAttending: boolean;
  plusOneName: string | null;
  plusOneMealChoice: MealChoice;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  dietaryNote: string | null;
  allergies: string | null;
  message: string | null;
  submittedAt: string | null;
  answers: RSVPAnswer[];
};

export type GuestListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  groupLabel: string | null;
  householdId: string | null;
  householdName: string | null;
  side: GuestSide;
  isChild: boolean;
  plusOne: PlusOne;
  invitationStatus: InvitationStatus;
  rsvpStatus: RsvpStatus;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  eventIds: string[];
};

export type GuestDetail = Guest & {
  invitations: InvitationSummary[];
  latestRsvp: {
    plusOneAttending: boolean;
    plusOneMealChoice: MealChoice;
    message: string | null;
    source: RsvpSource;
    submittedAt: string | null;
    answers: RSVPAnswer[];
  } | null;
};

export type HouseholdListItem = Household & {
  members: { id: string; firstName: string; lastName: string }[];
};

export type GuestWriteInput = {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  householdId: string | null;
  groupLabel: string | null;
  side: GuestSide;
  isChild: boolean;
  plusOneAllowed: boolean;
  plusOneName: string | null;
  plusOneAttending: boolean;
  plusOneMealChoice: MealChoice;
  invitationStatus: InvitationStatus;
  rsvpStatus: RsvpStatus;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  dietaryNote: string | null;
  allergies: string | null;
  privateNotes: string | null;
  eventIds: string[];
};

export type HouseholdWriteInput = {
  id: string | null;
  name: string;
  address: string | null;
};

export type PublicRsvpSubmission = {
  status: "attending" | "declined";
  attendingEventIds: string[];
  plusOneAttending: boolean;
  plusOneName: string | null;
  plusOneMealChoice: MealChoice;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  dietaryNote: string | null;
  allergies: string | null;
  message: string | null;
};

export type RsvpDashboard = {
  invited: number;
  attending: number;
  declined: number;
  awaiting: number;
  notInvited: number;
  plusOnesAllowed: number;
  plusOnesAttending: number;
  meals: { choice: MealChoice; count: number }[];
  dietary: { restriction: DietaryRestriction; count: number }[];
  events: {
    eventId: string;
    name: string;
    attending: number;
    declined: number;
    pending: number;
  }[];
  recent: {
    guestId: string;
    name: string;
    status: RsvpStatus;
    submittedAt: string;
    source: RsvpSource;
  }[];
};

export type PublicRsvpView = {
  weddingTitle: string;
  guestFirstName: string;
  plusOneAllowed: boolean;
  events: { id: string; name: string; whenLabel: string | null }[];
  defaults: {
    status: "attending" | "declined" | "";
    attendingEventIds: string[];
    plusOneAttending: boolean;
    plusOneName: string;
    plusOneMealChoice: MealChoice;
    mealChoice: MealChoice;
    dietary: DietaryRestriction[];
    dietaryNote: string;
    allergies: string;
    message: string;
  };
};

export type RsvpConfirmation = {
  weddingTitle: string;
  guestFirstName: string;
  status: "attending" | "declined";
  plusOneName: string | null;
  plusOneMealChoice: MealChoice;
  mealChoice: MealChoice;
  dietary: DietaryRestriction[];
  eventsAttending: { id: string; name: string }[];
  message: string | null;
};
