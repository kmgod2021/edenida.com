/** Safe application error. Never includes database or policy details. */
export class WorkspacePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspacePersistenceError";
  }
}

export const WORKSPACE_CREATE_FAILED = "Impossible de créer le mariage.";
export const WORKSPACE_SAVE_FAILED = "L'enregistrement a échoué.";
export const WORKSPACE_SAVE_FORBIDDEN =
  "Vous ne pouvez pas modifier ce mariage.";
