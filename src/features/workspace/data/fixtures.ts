import { addCalendarDays, calendarDateInTimeZone } from "../domain/dates";
import type { ModuleSignals } from "../domain/types";
import {
  EXAMPLE_MEMBER_ID,
  EXAMPLE_WEDDING_ID,
  FIXTURE_VIEWER_NAME,
  FIXTURE_VIEWER_USER_ID,
  type WorkspaceFixtureState,
} from "./state";

export function createExampleWorkspaceState(now: Date): WorkspaceFixtureState {
  const timezone = "America/Toronto";
  const today = calendarDateInTimeZone(now, timezone);
  const weddingDate = addCalendarDays(today, 180);
  const createdAt = now.toISOString();
  const signals: ModuleSignals = {
    websiteStatus: "draft",
    guestCount: 12,
    rsvpCount: 5,
    tasksCompleted: 4,
    tasksTotal: 10,
    budgetPlannedCents: 2_500_000,
    budgetSpentCents: 400_000,
  };

  return {
    version: 1,
    weddings: [
      {
        id: EXAMPLE_WEDDING_ID,
        title: "Camille & Julien",
        weddingDate,
        timezone,
        currency: "CAD",
        createdBy: FIXTURE_VIEWER_USER_ID,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    members: [
      {
        id: EXAMPLE_MEMBER_ID,
        weddingId: EXAMPLE_WEDDING_ID,
        userId: FIXTURE_VIEWER_USER_ID,
        role: "owner",
        createdAt,
      },
    ],
    partnerDisplayNames: {
      [EXAMPLE_WEDDING_ID]: "Julien Morel",
    },
    profileNames: {
      [FIXTURE_VIEWER_USER_ID]: FIXTURE_VIEWER_NAME,
    },
    signals: {
      [EXAMPLE_WEDDING_ID]: signals,
    },
  };
}
