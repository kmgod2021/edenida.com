import { z } from "zod";

import { WEDDING_MEMBER_ROLES } from "../domain/types";
import type {
  ModuleSignals,
  Wedding,
  WeddingMember,
} from "../domain/types";

/**
 * Local stand-in for the signed-in user until Wave B reads `auth.uid()`.
 * Never use this id with a service-role client.
 */
export const FIXTURE_VIEWER_USER_ID = "11111111-1111-4111-8111-111111111111";
export const FIXTURE_VIEWER_NAME = "Camille Laurent";

export const EXAMPLE_WEDDING_ID = "33333333-3333-4333-8333-333333333333";
export const EXAMPLE_MEMBER_ID = "44444444-4444-4444-8444-444444444444";

export type WorkspaceFixtureState = {
  version: 1;
  weddings: Wedding[];
  members: WeddingMember[];
  partnerDisplayNames: Record<string, string | null>;
  profileNames: Record<string, string>;
  signals: Record<string, ModuleSignals>;
};

const isoDateTime = z.iso.datetime();

const weddingSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(80),
  weddingDate: z.iso.date().nullable(),
  timezone: z.string().min(1).max(64),
  currency: z.string().regex(/^[A-Z]{3}$/),
  createdBy: z.uuid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const memberSchema = z.object({
  id: z.uuid(),
  weddingId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(WEDDING_MEMBER_ROLES),
  createdAt: isoDateTime,
});

const signalsSchema = z.object({
  websiteStatus: z.enum(["not_started", "draft", "published"]),
  guestCount: z.number().int().nonnegative().max(100_000),
  rsvpCount: z.number().int().nonnegative().max(100_000),
  tasksCompleted: z.number().int().nonnegative().max(100_000),
  tasksTotal: z.number().int().nonnegative().max(100_000),
  budgetPlannedCents: z.number().int().nonnegative().nullable(),
  budgetSpentCents: z.number().int().nonnegative().nullable(),
});

export const workspaceStateSchema = z.object({
  version: z.literal(1),
  weddings: z.array(weddingSchema).max(20),
  members: z.array(memberSchema).max(100),
  partnerDisplayNames: z.record(z.string(), z.string().max(80).nullable()),
  profileNames: z.record(z.string(), z.string().max(120)),
  signals: z.record(z.string(), signalsSchema),
});

export function createEmptyWorkspaceState(): WorkspaceFixtureState {
  return {
    version: 1,
    weddings: [],
    members: [],
    partnerDisplayNames: {},
    profileNames: {
      [FIXTURE_VIEWER_USER_ID]: FIXTURE_VIEWER_NAME,
    },
    signals: {},
  };
}

export function parseWorkspaceState(raw: string | undefined): WorkspaceFixtureState {
  if (!raw) return createEmptyWorkspaceState();
  try {
    const json: unknown = JSON.parse(decodeURIComponent(raw));
    const parsed = workspaceStateSchema.safeParse(json);
    if (!parsed.success) return createEmptyWorkspaceState();
    return parsed.data;
  } catch {
    return createEmptyWorkspaceState();
  }
}

export function serializeWorkspaceState(state: WorkspaceFixtureState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export const MAX_WORKSPACE_COOKIE_LENGTH = 3500;
