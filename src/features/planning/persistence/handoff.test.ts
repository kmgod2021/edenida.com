import { describe, expect, it } from "vitest";
import { planningSnapshotSchema, planningTaskSchema } from "../domain/schemas";
import { PLANNING_PERSISTENCE_HANDOFF } from "./handoff";

describe("planning persistence handoff", () => {
  it("is ready for data integration and excludes guest PII", () => {
    expect(PLANNING_PERSISTENCE_HANDOFF.status).toBe("READY_FOR_DATA_INTEGRATION");
    expect(PLANNING_PERSISTENCE_HANDOFF.tables.tasks.assigneeMemberId).toBe(
      "assignee_member_id",
    );
    expect(PLANNING_PERSISTENCE_HANDOFF.tables.timeline_items).toMatchObject({
      time: "time",
      activity: "activity",
      location: "location",
      responsibleMemberId: "owner",
      notes: "notes",
    });

    expect(Object.keys(planningSnapshotSchema.shape)).not.toContain("guests");
    expect(Object.keys(planningTaskSchema.shape)).not.toEqual(
      expect.arrayContaining(["email", "phone", "address"]),
    );
  });
});
