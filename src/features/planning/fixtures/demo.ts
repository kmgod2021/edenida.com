import type { WeddingMemberRef } from "../domain/schemas";

/** Canada-first default. Overdue math uses the calendar date supplied by the caller. */
export const DEFAULT_WEDDING_TIMEZONE = "America/Toronto";

/**
 * Placeholder members for the local adapter.
 * Data integration should pass real wedding_members, owner first.
 * These names are fixtures, not accounts.
 */
export const DEMO_MEMBERS: readonly WeddingMemberRef[] = [
  { id: "member-owner", displayName: "Camille" },
  { id: "member-partner", displayName: "Julien" },
];
