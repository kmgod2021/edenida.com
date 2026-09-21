/**
 * Wedding workspace domain.
 *
 * These types mirror the foundation tables `weddings` and `wedding_members`
 * (see supabase/migrations/20260920010000_foundation.sql). They are not a
 * second membership model. A display name collected before someone has a
 * user account is `partnerDisplayName` on the read model — never a
 * `wedding_members` row without `user_id`.
 */

export const WEDDING_MEMBER_ROLES = [
  "owner",
  "partner",
  "collaborator",
  "wedding_planner",
  "viewer",
] as const;

export type WeddingMemberRole = (typeof WEDDING_MEMBER_ROLES)[number];

export type Wedding = {
  id: string;
  title: string;
  weddingDate: string | null;
  timezone: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WeddingMember = {
  id: string;
  weddingId: string;
  userId: string;
  role: WeddingMemberRole;
  createdAt: string;
};

export type WebsiteStatus = "not_started" | "draft" | "published";

/** Signals later filled by website, guests, checklist, and budget. */
export type ModuleSignals = {
  websiteStatus: WebsiteStatus;
  guestCount: number;
  rsvpCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  budgetPlannedCents: number | null;
  budgetSpentCents: number | null;
};

export type CurrentWedding = {
  wedding: Wedding;
  /** Membership row of the signed-in viewer. */
  membership: WeddingMember;
  /** Every `wedding_members` row for this wedding. */
  members: WeddingMember[];
  /**
   * Name shown before a partner has a user id. Not a membership.
   * Wave B should persist this on `wedding_settings`, not `wedding_members`.
   */
  partnerDisplayName: string | null;
  /** `profiles.full_name` keyed by user id. Empty until profiles are joined. */
  profileNames: Record<string, string>;
};

export const PROGRESS_STEP_IDS = [
  "date",
  "website",
  "guests",
  "checklist",
  "budget",
] as const;

export type ProgressStepId = (typeof PROGRESS_STEP_IDS)[number];

export type ProgressStep = {
  id: ProgressStepId;
  /** 0 to 1. */
  ratio: number;
};

export type WeddingSummary = {
  weddingId: string;
  title: string;
  weddingDate: string | null;
  timezone: string;
  currency: string;
  daysUntil: number | null;
  partnerDisplayName: string | null;
  progress: {
    percent: number;
    steps: ProgressStep[];
  };
  websiteStatus: WebsiteStatus;
  guestCount: number;
  rsvpCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  budgetPlannedCents: number | null;
  budgetSpentCents: number | null;
};

export type WeddingDetailsInput = {
  title: string;
  partnerName: string | null;
  weddingDate: string | null;
  timezone: string;
  currency: string;
};

export type CreateWeddingInput = WeddingDetailsInput;
export type UpdateWeddingInput = WeddingDetailsInput;

/**
 * What the workspace shell reads for the wedding currently open.
 * `current` is membership-scoped; `summary` is the dashboard read model.
 */
export type WeddingContext = {
  viewerUserId: string;
  current: CurrentWedding;
  summary: WeddingSummary;
};
