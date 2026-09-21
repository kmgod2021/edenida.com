export type {
  Wedding,
  WeddingMember,
  WeddingMemberRole,
  CurrentWedding,
  WeddingSummary,
  WeddingContext,
  CreateWeddingInput,
  UpdateWeddingInput,
  ModuleSignals,
  ProgressStepId,
} from "./domain/types";

export { WEDDING_MEMBER_ROLES, PROGRESS_STEP_IDS } from "./domain/types";
export { daysUntilWedding, countdownCopy, formatWeddingDate } from "./domain/dates";
export { buildProgress, emptyModuleSignals } from "./domain/progress";
export { weddingDetailsSchema, toWeddingDetails } from "./domain/validation";
export { workspaceNavItems, isNavItemActive } from "./domain/nav";
export type { WeddingRepository, WeddingWorkspaceService } from "./data/repository";
export { createWeddingWorkspaceService } from "./data/repository";
