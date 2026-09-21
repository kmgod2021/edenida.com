import { PLANNING_STORAGE_KEY_PREFIX } from "./storage-repository";

/**
 * Data-integration contract for checklist, events, and the day-of timeline.
 * Wave A does not migrate. Implement `PlanningRepository` with the user JWT.
 */
export const PLANNING_PERSISTENCE_HANDOFF = {
  status: "READY_FOR_DATA_INTEGRATION",
  port: "PlanningRepository",
  localAdapter: "createStoragePlanningRepository",
  browserAdapter: "createBrowserPlanningRepository",
  localKeyPrefix: PLANNING_STORAGE_KEY_PREFIX,
  snapshotVersion: 1,
  upcomingWindowDays: 21,
  constraints: [
    "Replace the local adapter. Do not treat localStorage as the production store.",
    "Use the signed-in Supabase client only. Never import service_role into this feature or any browser bundle.",
    "Guest PII (email, phone, address, RSVP notes) does not belong in planning payloads.",
    "RLS must scope task_categories, tasks, events, and timeline_items by wedding membership.",
    "Overdue and upcoming are derived from due_at and the caller calendar date. Do not store those flags.",
    "Template assignment uses member order only until wedding_members exists: owner first, partner second.",
  ],
  tables: {
    task_categories: {
      id: "id",
      weddingId: "wedding_id",
      name: "name",
      sortOrder: "sort_order",
    },
    tasks: {
      id: "id",
      weddingId: "wedding_id",
      categoryId: "category_id",
      title: "title",
      notes: "notes",
      priority: "priority",
      status: "status",
      dueDate: "due_at",
      assigneeMemberId: "assignee_member_id",
    },
    events: {
      id: "id",
      weddingId: "wedding_id",
      kind: "kind",
      title: "title",
      date: "event_date",
      startTime: "start_time",
      endTime: "end_time",
      location: "location",
      notes: "notes",
    },
    timeline_items: {
      id: "id",
      weddingId: "wedding_id",
      time: "time",
      activity: "activity",
      location: "location",
      responsibleMemberId: "owner",
      notes: "notes",
      sortOrder: "sort",
    },
  },
} as const;
