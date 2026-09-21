import type { MealChoice, PlusOne } from "@/features/guests/domain/types";

export function normalizePlusOne(input: {
  allowed: boolean;
  name: string | null;
  guestId?: string | null;
}): PlusOne {
  if (!input.allowed) {
    return { allowed: false, name: null, guestId: null };
  }
  const name = input.name?.trim() || null;
  return {
    allowed: true,
    name,
    guestId: input.guestId ?? null,
  };
}

export function normalizePlusOneAttendance(input: {
  allowed: boolean;
  guestAttending: boolean;
  plusOneAttending: boolean;
  plusOneName: string | null;
  plusOneMealChoice: MealChoice;
}) {
  if (!input.allowed || !input.guestAttending || !input.plusOneAttending) {
    return {
      plusOneAttending: false,
      plusOneName: input.allowed ? input.plusOneName : null,
      plusOneMealChoice: "unset" as const,
    };
  }
  return {
    plusOneAttending: true,
    plusOneName: input.plusOneName?.trim() || null,
    plusOneMealChoice: input.plusOneMealChoice,
  };
}
