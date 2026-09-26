import { daysUntilWedding } from "./dates";
import { buildProgress } from "./progress";
import type {
  CurrentWedding,
  ModuleSignals,
  Wedding,
  WeddingSummary,
} from "./types";

export function buildWeddingSummary(input: {
  wedding: Wedding;
  partnerDisplayName: string | null;
  signals: ModuleSignals;
  now: Date;
}): WeddingSummary {
  const progress = buildProgress({
    weddingDate: input.wedding.weddingDate,
    signals: input.signals,
  });
  return {
    weddingId: input.wedding.id,
    title: input.wedding.title,
    weddingDate: input.wedding.weddingDate,
    timezone: input.wedding.timezone,
    currency: input.wedding.currency,
    daysUntil: daysUntilWedding(
      input.wedding.weddingDate,
      input.now,
      input.wedding.timezone,
    ),
    partnerDisplayName: input.partnerDisplayName,
    progress,
    websiteStatus: input.signals.websiteStatus,
    guestCount: input.signals.guestCount,
    rsvpCount: input.signals.rsvpCount,
    tasksCompleted: input.signals.tasksCompleted,
    tasksTotal: input.signals.tasksTotal,
    budgetPlannedCents: input.signals.budgetPlannedCents,
    budgetSpentCents: input.signals.budgetSpentCents,
  };
}

export function readCurrentWedding(input: {
  wedding: Wedding;
  members: CurrentWedding["members"];
  viewerUserId: string;
  partnerDisplayName: string | null;
  profileNames: Record<string, string>;
}): CurrentWedding | null {
  const membership = input.members.find(
    (member) => member.userId === input.viewerUserId,
  );
  if (!membership) return null;
  return {
    wedding: input.wedding,
    membership,
    members: input.members,
    partnerDisplayName: input.partnerDisplayName,
    profileNames: input.profileNames,
  };
}
