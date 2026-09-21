import { addDays } from "./dates";
import { DEFAULT_WEDDING_TIMEZONE } from "../fixtures/demo";
import type {
  EventKind,
  PlanningSnapshot,
  TaskPriority,
  WeddingMemberRef,
} from "./schemas";

type AssigneeSlot = "owner" | "partner" | null;

type CategorySeed = {
  key: string;
  name: string;
  sortOrder: number;
};

type TaskSeed = {
  key: string;
  categoryKey: string;
  title: string;
  notes: string;
  priority: TaskPriority;
  /** Days relative to the wedding date. Null keeps the task undated. */
  offsetDays: number | null;
  assignee: AssigneeSlot;
};

type EventSeed = {
  key: string;
  kind: EventKind;
  title: string;
  offsetDays: number | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  notes: string;
};

type TimelineSeed = {
  key: string;
  time: string;
  activity: string;
  location: string;
  assignee: AssigneeSlot;
  notes: string;
  sortOrder: number;
};

const CATEGORIES: readonly CategorySeed[] = [
  { key: "venue", name: "Lieu", sortOrder: 0 },
  { key: "guests", name: "Invités", sortOrder: 1 },
  { key: "vendors", name: "Prestataires", sortOrder: 2 },
  { key: "attire", name: "Tenues", sortOrder: 3 },
  { key: "day-of", name: "Jour J", sortOrder: 4 },
];

const TASKS: readonly TaskSeed[] = [
  {
    key: "choose-date",
    categoryKey: "venue",
    title: "Choisir la date",
    notes: "",
    priority: "high",
    offsetDays: -400,
    assignee: "owner",
  },
  {
    key: "book-venue",
    categoryKey: "venue",
    title: "Réserver le lieu",
    notes: "Confirmer la capacité et la salle de repli.",
    priority: "high",
    offsetDays: -365,
    assignee: "owner",
  },
  {
    key: "caterer",
    categoryKey: "vendors",
    title: "Choisir le traiteur",
    notes: "",
    priority: "high",
    offsetDays: -200,
    assignee: "owner",
  },
  {
    key: "guest-list",
    categoryKey: "guests",
    title: "Établir la liste d'invités",
    notes: "Inclure les témoins et les familles proches.",
    priority: "high",
    offsetDays: -180,
    assignee: "partner",
  },
  {
    key: "save-the-date",
    categoryKey: "guests",
    title: "Envoyer les save the date",
    notes: "",
    priority: "medium",
    offsetDays: -150,
    assignee: "partner",
  },
  {
    key: "attire",
    categoryKey: "attire",
    title: "Prévoir les essayages",
    notes: "",
    priority: "medium",
    offsetDays: -90,
    assignee: null,
  },
  {
    key: "vendor-brief",
    categoryKey: "day-of",
    title: "Briefer les prestataires",
    notes: "",
    priority: "high",
    offsetDays: -7,
    assignee: "owner",
  },
  {
    key: "confirm-timeline",
    categoryKey: "day-of",
    title: "Relire le déroulé du jour J",
    notes: "",
    priority: "medium",
    offsetDays: -2,
    assignee: "partner",
  },
];

const EVENTS: readonly EventSeed[] = [
  {
    key: "ceremony",
    kind: "wedding",
    title: "Cérémonie",
    offsetDays: 0,
    startTime: "15:00",
    endTime: "16:00",
    location: "Chapelle du domaine",
    notes: "Échange des vœux.",
  },
  {
    key: "cocktail",
    kind: "wedding",
    title: "Vin d'honneur",
    offsetDays: 0,
    startTime: "16:30",
    endTime: "18:00",
    location: "Jardin",
    notes: "",
  },
  {
    key: "dinner",
    kind: "wedding",
    title: "Dîner",
    offsetDays: 0,
    startTime: "19:00",
    endTime: "23:00",
    location: "Orangerie",
    notes: "",
  },
  {
    key: "tasting",
    kind: "planning",
    title: "Dégustation du gâteau",
    offsetDays: -60,
    startTime: "11:00",
    endTime: "12:00",
    location: "Atelier pâtisserie",
    notes: "",
  },
  {
    key: "florist",
    kind: "planning",
    title: "Rendez-vous fleuriste",
    offsetDays: -30,
    startTime: "14:00",
    endTime: "15:00",
    location: "Atelier floral",
    notes: "",
  },
];

const TIMELINE: readonly TimelineSeed[] = [
  {
    key: "welcome",
    time: "13:30",
    activity: "Accueil des proches",
    location: "Parvis",
    assignee: "partner",
    notes: "Les familles se placent avant l'entrée.",
    sortOrder: 0,
  },
  {
    key: "ceremony",
    time: "15:00",
    activity: "Cérémonie",
    location: "Chapelle du domaine",
    assignee: "owner",
    notes: "Entrée, lectures, échange des vœux.",
    sortOrder: 1,
  },
  {
    key: "photos",
    time: "16:15",
    activity: "Photos",
    location: "Jardin",
    assignee: null,
    notes: "Portraits avec les témoins.",
    sortOrder: 2,
  },
  {
    key: "cocktail",
    time: "17:00",
    activity: "Vin d'honneur",
    location: "Jardin",
    assignee: "partner",
    notes: "",
    sortOrder: 3,
  },
  {
    key: "dinner",
    time: "19:00",
    activity: "Dîner",
    location: "Orangerie",
    assignee: "owner",
    notes: "",
    sortOrder: 4,
  },
  {
    key: "dance",
    time: "21:30",
    activity: "Ouverture du bal",
    location: "Orangerie",
    assignee: "owner",
    notes: "Première danse.",
    sortOrder: 5,
  },
  {
    key: "close",
    time: "23:30",
    activity: "Fin de la soirée",
    location: "Orangerie",
    assignee: "partner",
    notes: "",
    sortOrder: 6,
  },
];

export type PlanningSeedInput = {
  weddingId: string;
  weddingDate: string | null;
  members?: readonly WeddingMemberRef[];
  timezone?: string;
};

function memberForSlot(
  members: readonly WeddingMemberRef[],
  slot: AssigneeSlot,
): string | null {
  if (slot === "owner") return members[0]?.id ?? null;
  if (slot === "partner") return members[1]?.id ?? null;
  return null;
}

function shift(weddingDate: string | null, offsetDays: number | null): string | null {
  if (weddingDate === null || offsetDays === null) return null;
  return addDays(weddingDate, offsetDays);
}

export function createEmptyPlanningSnapshot(input: PlanningSeedInput): PlanningSnapshot {
  return {
    version: 1,
    weddingId: input.weddingId,
    weddingDate: input.weddingDate,
    timezone: input.timezone ?? DEFAULT_WEDDING_TIMEZONE,
    members: [...(input.members ?? [])],
    categories: [],
    tasks: [],
    events: [],
    timeline: [],
  };
}

export function createSeededPlanningSnapshot(input: PlanningSeedInput): PlanningSnapshot {
  const members = [...(input.members ?? [])];
  const weddingId = input.weddingId;

  return {
    version: 1,
    weddingId,
    weddingDate: input.weddingDate,
    timezone: input.timezone ?? DEFAULT_WEDDING_TIMEZONE,
    members,
    categories: CATEGORIES.map((category) => ({
      id: `category:${category.key}`,
      weddingId,
      name: category.name,
      sortOrder: category.sortOrder,
    })),
    tasks: TASKS.map((task) => ({
      id: `task:${task.key}`,
      weddingId,
      categoryId: `category:${task.categoryKey}`,
      title: task.title,
      notes: task.notes,
      priority: task.priority,
      status: "todo",
      dueDate: shift(input.weddingDate, task.offsetDays),
      assigneeMemberId: memberForSlot(members, task.assignee),
    })),
    events: EVENTS.map((event) => ({
      id: `event:${event.key}`,
      weddingId,
      kind: event.kind,
      title: event.title,
      date: shift(input.weddingDate, event.offsetDays),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      notes: event.notes,
    })),
    timeline: TIMELINE.map((item) => ({
      id: `timeline:${item.key}`,
      weddingId,
      time: item.time,
      activity: item.activity,
      location: item.location,
      responsibleMemberId: memberForSlot(members, item.assignee),
      notes: item.notes,
      sortOrder: item.sortOrder,
    })),
  };
}
