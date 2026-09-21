import { UPCOMING_WINDOW_DAYS } from "../domain/progress";
import type { EventKind, TaskPriority, TaskStatus } from "../domain/schemas";

export const copy = {
  brand: "Edenida",
  workspace: "Espace",
  title: "Planning",
  intro: "La checklist, les événements et le déroulé du jour J, au même endroit.",
  dateKnown: "Date du mariage",
  dateUnknown: "La date du mariage n'est pas encore fixée. Les échéances restent à préciser.",
  loading: "Chargement du planning…",
  errorUnavailable: "Nous n'avons pas pu charger le planning.",
  errorInvalid: "Les données de planning enregistrées sur cet appareil sont illisibles.",
  errorHint: "Rien n'a été perdu sur le serveur : cette étape est encore locale.",
  retry: "Réessayer",
  saved: "Planning enregistré",
  saveFailed: "Le planning n'a pas pu être enregistré sur cet appareil.",
  progressLabel: "Progression de la checklist",
  filterLabel: "Filtrer les tâches",
  filterAll: "Toutes",
  filterOverdue: "En retard",
  filterUpcoming: "À venir",
  emptyTasks: "Aucune tâche pour l'instant.",
  emptyTasksHint: "Ajoutez une catégorie, puis la première tâche.",
  emptyOverdue: "Rien en retard. Vous êtes à jour.",
  emptyEvents: "Aucun événement pour l'instant.",
  emptyEventsHint: "Ajoutez la cérémonie, un dîner, ou un rendez-vous de préparation.",
  emptyTimeline: "Le déroulé du jour J est vide.",
  emptyTimelineHint: "Posez le premier moment : une heure, un lieu, une personne.",
  emptyCategory: "Aucune tâche dans cette catégorie.",
  unassigned: "Non assigné",
  locationMissing: "Lieu à préciser",
  overdue: "En retard",
  upcoming: "À venir",
  addTask: "Ajouter une tâche",
  addTaskSubmit: "Ajouter la tâche",
  addCategory: "Nouvelle catégorie",
  addCategorySubmit: "Ajouter la catégorie",
  categoryName: "Nom de la catégorie",
  taskTitle: "Titre de la tâche",
  taskCategory: "Catégorie",
  taskPriority: "Priorité de la tâche",
  taskDue: "Échéance de la tâche",
  taskAssignee: "Personne assignée",
  taskNotes: "Notes de la tâche",
  needCategory: "Ajoutez une catégorie avant de créer une tâche.",
  addEvent: "Ajouter un événement",
  addEventSubmit: "Ajouter l'événement",
  eventTitle: "Titre de l'événement",
  eventKind: "Type d'événement",
  eventDate: "Date de l'événement",
  eventStart: "Heure de début",
  eventEnd: "Heure de fin",
  eventLocation: "Lieu de l'événement",
  eventNotes: "Notes de l'événement",
  weddingEvents: "Mariage",
  planningEvents: "Préparation",
  addMoment: "Ajouter un moment",
  addMomentSubmit: "Ajouter le moment",
  momentTime: "Heure du moment",
  momentActivity: "Activité",
  momentLocation: "Lieu du moment",
  momentOwner: "Personne responsable",
  momentNotes: "Notes du moment",
  status: "Statut",
  priority: "Priorité",
  due: "Échéance",
  assignee: "Assignée à",
  deleteTask: "Supprimer la tâche",
  deleteEvent: "Supprimer l'événement",
  deleteMoment: "Supprimer le moment",
  tabsLabel: "Sections du planning",
  checklist: "Checklist",
  events: "Événements",
  timeline: "Jour J",
} as const;

export const priorityLabel: Record<TaskPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export const statusLabel: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Fait",
};

export const eventKindLabel: Record<EventKind, string> = {
  wedding: "Mariage",
  planning: "Préparation",
};

export function upcomingEmptyCopy(): string {
  return `Rien dans les ${UPCOMING_WINDOW_DAYS} prochains jours.`;
}

export function progressCount(done: number, total: number): string {
  return `${done} sur ${total}`;
}
