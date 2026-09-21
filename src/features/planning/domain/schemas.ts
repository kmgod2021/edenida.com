import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(1, "Identifiant requis")
  .max(200, "Identifiant trop long");

export const isoDateSchema = z.iso.date({ error: "Date invalide" });

/** Clock time stored as HH:mm so day-of items sort lexicographically. */
export const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");

export const taskPrioritySchema = z.enum(["low", "medium", "high"], {
  error: "Priorité invalide",
});

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"], {
  error: "Statut invalide",
});

export const eventKindSchema = z.enum(["wedding", "planning"], {
  error: "Type d'événement invalide",
});

export const weddingMemberRefSchema = z.strictObject({
  id: idSchema,
  displayName: z
    .string()
    .trim()
    .min(1, "Le nom est requis")
    .max(120, "Le nom est trop long"),
});

export const taskCategorySchema = z.strictObject({
  id: idSchema,
  weddingId: idSchema,
  name: z
    .string()
    .trim()
    .min(1, "Le nom de la catégorie est requis")
    .max(80, "Le nom de la catégorie est trop long"),
  sortOrder: z.number().int().nonnegative(),
});

export const planningTaskSchema = z.strictObject({
  id: idSchema,
  weddingId: idSchema,
  categoryId: idSchema,
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(160, "Le titre est trop long"),
  notes: z.string().trim().max(2000, "Les notes sont trop longues"),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: isoDateSchema.nullable(),
  assigneeMemberId: idSchema.nullable(),
});

export const planningEventSchema = z.strictObject({
  id: idSchema,
  weddingId: idSchema,
  kind: eventKindSchema,
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(160, "Le titre est trop long"),
  date: isoDateSchema.nullable(),
  startTime: clockTimeSchema.nullable(),
  endTime: clockTimeSchema.nullable(),
  location: z.string().trim().max(200, "Le lieu est trop long"),
  notes: z.string().trim().max(2000, "Les notes sont trop longues"),
});

export const timelineItemSchema = z.strictObject({
  id: idSchema,
  weddingId: idSchema,
  time: clockTimeSchema,
  activity: z
    .string()
    .trim()
    .min(1, "L'activité est requise")
    .max(160, "L'activité est trop longue"),
  location: z.string().trim().max(200, "Le lieu est trop long"),
  responsibleMemberId: idSchema.nullable(),
  notes: z.string().trim().max(2000, "Les notes sont trop longues"),
  sortOrder: z.number().int().nonnegative(),
});

export const planningSnapshotSchema = z.strictObject({
  version: z.literal(1),
  weddingId: idSchema,
  weddingDate: isoDateSchema.nullable(),
  timezone: z.string().trim().min(1).max(80),
  members: z.array(weddingMemberRefSchema).max(50),
  categories: z.array(taskCategorySchema).max(80),
  tasks: z.array(planningTaskSchema).max(400),
  events: z.array(planningEventSchema).max(200),
  timeline: z.array(timelineItemSchema).max(200),
});

export const addTaskInputSchema = z.strictObject({
  title: planningTaskSchema.shape.title,
  categoryId: idSchema,
  priority: taskPrioritySchema,
  dueDate: isoDateSchema.nullable(),
  assigneeMemberId: idSchema.nullable(),
  notes: planningTaskSchema.shape.notes,
});

export const taskPatchSchema = z
  .strictObject({
    title: planningTaskSchema.shape.title.optional(),
    notes: planningTaskSchema.shape.notes.optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: isoDateSchema.nullable().optional(),
    assigneeMemberId: idSchema.nullable().optional(),
    categoryId: idSchema.optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    error: "Aucune modification",
  });

export const addEventInputSchema = z.strictObject({
  title: planningEventSchema.shape.title,
  kind: eventKindSchema,
  date: isoDateSchema.nullable(),
  startTime: clockTimeSchema.nullable(),
  endTime: clockTimeSchema.nullable(),
  location: planningEventSchema.shape.location,
  notes: planningEventSchema.shape.notes,
});

export const addTimelineInputSchema = z.strictObject({
  time: clockTimeSchema,
  activity: timelineItemSchema.shape.activity,
  location: timelineItemSchema.shape.location,
  responsibleMemberId: idSchema.nullable(),
  notes: timelineItemSchema.shape.notes,
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type EventKind = z.infer<typeof eventKindSchema>;
export type WeddingMemberRef = z.infer<typeof weddingMemberRefSchema>;
export type TaskCategory = z.infer<typeof taskCategorySchema>;
export type PlanningTask = z.infer<typeof planningTaskSchema>;
export type PlanningEvent = z.infer<typeof planningEventSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;
export type PlanningSnapshot = z.infer<typeof planningSnapshotSchema>;
export type AddTaskInput = z.infer<typeof addTaskInputSchema>;
export type TaskPatch = z.infer<typeof taskPatchSchema>;
export type AddEventInput = z.infer<typeof addEventInputSchema>;
export type AddTimelineInput = z.infer<typeof addTimelineInputSchema>;
