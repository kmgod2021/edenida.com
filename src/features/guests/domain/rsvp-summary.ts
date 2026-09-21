import type {
  DietaryRestriction,
  Guest,
  MealChoice,
  RSVP,
  RsvpDashboard,
  WeddingEvent,
} from "@/features/guests/domain/types";

function bump<T extends string>(map: Map<T, number>, key: T) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function buildRsvpDashboard(input: {
  guests: Guest[];
  rsvps: RSVP[];
  events: WeddingEvent[];
}): RsvpDashboard {
  const rsvpByGuest = new Map(input.rsvps.map((rsvp) => [rsvp.guestId, rsvp]));
  const meals = new Map<MealChoice, number>();
  const dietary = new Map<DietaryRestriction, number>();

  let invited = 0;
  let attending = 0;
  let declined = 0;
  let awaiting = 0;
  let notInvited = 0;
  let plusOnesAllowed = 0;

  for (const guest of input.guests) {
    const isInvited = guest.invitationStatus !== "not_invited";
    if (isInvited) invited += 1;
    else notInvited += 1;
    if (guest.rsvpStatus === "attending") attending += 1;
    if (guest.rsvpStatus === "declined") declined += 1;
    if (isInvited && guest.rsvpStatus === "pending") awaiting += 1;
    if (guest.plusOne.allowed) plusOnesAllowed += 1;

    if (guest.rsvpStatus !== "attending") continue;
    const rsvp = rsvpByGuest.get(guest.id);
    const meal = rsvp?.mealChoice ?? guest.mealChoice;
    if (meal !== "unset") bump(meals, meal);
    if (rsvp?.plusOneAttending && rsvp.plusOneMealChoice !== "unset") {
      bump(meals, rsvp.plusOneMealChoice);
    }
    for (const restriction of guest.dietary) bump(dietary, restriction);
  }

  const plusOnesAttending = input.rsvps.filter(
    (rsvp) => rsvp.status === "attending" && rsvp.plusOneAttending,
  ).length;

  const events = input.events.map((event) => {
    let eventAttending = 0;
    let eventDeclined = 0;
    let eventPending = 0;
    for (const guest of input.guests) {
      if (guest.invitationStatus === "not_invited") continue;
      if (!guest.eventIds.includes(event.id)) continue;
      const answer = rsvpByGuest
        .get(guest.id)
        ?.answers.find((item) => item.eventId === event.id);
      if (answer) {
        if (answer.attending) eventAttending += 1;
        else eventDeclined += 1;
        continue;
      }
      if (guest.rsvpStatus === "declined") eventDeclined += 1;
      else if (guest.rsvpStatus === "attending") eventAttending += 1;
      else eventPending += 1;
    }
    return {
      eventId: event.id,
      name: event.name,
      attending: eventAttending,
      declined: eventDeclined,
      pending: eventPending,
    };
  });

  const recent = input.rsvps
    .filter((rsvp) => rsvp.submittedAt)
    .sort((a, b) => (a.submittedAt! < b.submittedAt! ? 1 : -1))
    .slice(0, 8)
    .flatMap((rsvp) => {
      const guest = input.guests.find((item) => item.id === rsvp.guestId);
      if (!guest || !rsvp.submittedAt) return [];
      return [
        {
          guestId: guest.id,
          name: `${guest.firstName} ${guest.lastName}`,
          status: rsvp.status,
          submittedAt: rsvp.submittedAt,
          source: rsvp.source,
        },
      ];
    });

  return {
    invited,
    attending,
    declined,
    awaiting,
    notInvited,
    plusOnesAllowed,
    plusOnesAttending,
    meals: [...meals.entries()].map(([choice, count]) => ({ choice, count })),
    dietary: [...dietary.entries()].map(([restriction, count]) => ({
      restriction,
      count,
    })),
    events,
    recent,
  };
}
