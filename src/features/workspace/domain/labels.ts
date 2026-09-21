import type { WeddingMemberRole } from "./types";

export const WEDDING_ROLE_LABELS: Record<WeddingMemberRole, string> = {
  owner: "Organisateur",
  partner: "Partenaire",
  collaborator: "Collaborateur",
  wedding_planner: "Planificateur",
  viewer: "Lecture seule",
};

export const PROGRESS_STEP_LABELS = {
  date: "Date",
  website: "Site",
  guests: "Invités",
  checklist: "Checklist",
  budget: "Budget",
} as const;

export function progressStepStatus(ratio: number): string {
  if (ratio >= 1) return "en place";
  if (ratio > 0) return "en cours";
  return "à faire";
}
