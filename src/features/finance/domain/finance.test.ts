import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyInput } from "./money";
import { financeWorkspaceSchema, optionalEmailSchema } from "./schemas";
import {
  addBudgetItem,
  addCategory,
  addPayment,
  addVendor,
  addVendorContact,
  deleteCategory,
  deleteVendor,
  markPaymentPaid,
  setTotalBudget,
  type CommandResult,
} from "./commands";
import {
  createEmptyWorkspace,
  createFixedIdFactory,
  isItemOverdue,
  isPaymentOverdue,
  itemMoney,
  rollupWorkspace,
  vendorMoney,
} from "./workspace";
import type { FinanceWorkspace } from "./types";
import { createSampleWorkspace } from "../fixtures/sample-workspace";
import {
  assertReadyForDataIntegration,
  FINANCE_INTEGRATION_STATUS,
} from "../integration-status";

function unwrap(result: CommandResult): FinanceWorkspace {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result.workspace;
}

describe("formatMoney / parseMoneyInput", () => {
  it("formats cents with regular spaces and CAD", () => {
    expect(formatMoney(1_150_000)).toBe("11 500,00 CAD");
    expect(formatMoney(0)).toBe("0,00 CAD");
    expect(formatMoney(-2_550)).toBe("-25,50 CAD");
  });

  it("parses French and plain money strings", () => {
    expect(parseMoneyInput("7500")).toBe(750_000);
    expect(parseMoneyInput("7 500")).toBe(750_000);
    expect(parseMoneyInput("7 500,50")).toBe(750_050);
    expect(parseMoneyInput("3200.00")).toBe(320_000);
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
  });
});

describe("schemas", () => {
  it("rejects negative cents", () => {
    const workspace = createEmptyWorkspace("w1");
    const invalid = {
      ...workspace,
      totalBudgetCents: -1,
    };
    expect(financeWorkspaceSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts empty or valid emails for contacts", () => {
    expect(optionalEmailSchema.safeParse("").success).toBe(true);
    expect(optionalEmailSchema.safeParse("lea@atelier.ca").success).toBe(true);
    expect(optionalEmailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("sample fixture rollups", () => {
  it("matches the Wave A CAD demo totals", () => {
    const sample = createSampleWorkspace();
    const rollup = rollupWorkspace(sample);
    expect(sample.totalBudgetCents).toBe(4_000_000);
    expect(rollup.estimatedTotalCents).toBe(2_530_000);
    expect(rollup.committedTotalCents).toBe(2_370_000);
    expect(rollup.paidTotalCents).toBe(380_000);
    expect(rollup.remainingToPayCents).toBe(1_990_000);
    expect(rollup.budgetRemainingCents).toBe(1_630_000);
  });

  it("computes vendor balances", () => {
    const sample = createSampleWorkspace();
    const venue = sample.vendors.find((vendor) => vendor.id === "vendor_domaine")!;
    expect(vendorMoney(venue).balanceCents).toBe(850_000);
  });
});

describe("commands + due dates", () => {
  const now = new Date("2026-04-01T12:00:00.000Z");
  const createId = createFixedIdFactory("t");

  it("builds a budget path and marks payment paid", () => {
    let workspace = createEmptyWorkspace("w1", now);
    workspace = unwrap(setTotalBudget(workspace, 1_000_000, { now }));
    workspace = unwrap(
      addCategory(workspace, { name: "Photo" }, { now, createId }),
    );
    const categoryId = workspace.categories[0]!.id;
    workspace = unwrap(
      addBudgetItem(
        workspace,
        {
          categoryId,
          name: "Forfait",
          estimatedCents: 350_000,
          committedCents: 320_000,
          dueOn: "2026-03-01",
        },
        { now, createId },
      ),
    );
    const itemId = workspace.items[0]!.id;
    workspace = unwrap(
      addPayment(
        workspace,
        {
          budgetItemId: itemId,
          amountCents: 80_000,
          label: "Dépôt",
          dueOn: "2026-02-01",
        },
        { now, createId },
      ),
    );

    expect(
      itemMoney(workspace.items[0]!, workspace.payments).remainingCents,
    ).toBe(320_000);
    expect(
      isItemOverdue(workspace.items[0]!, workspace.payments, "2026-04-01"),
    ).toBe(true);
    expect(isPaymentOverdue(workspace.payments[0]!, "2026-04-01")).toBe(true);

    workspace = unwrap(
      markPaymentPaid(workspace, workspace.payments[0]!.id, "2026-04-01", {
        now,
      }),
    );
    expect(itemMoney(workspace.items[0]!, workspace.payments).paidCents).toBe(
      80_000,
    );
    expect(
      itemMoney(workspace.items[0]!, workspace.payments).remainingCents,
    ).toBe(240_000);
    expect(isPaymentOverdue(workspace.payments[0]!, "2026-04-01")).toBe(false);
  });

  it("blocks category delete while items remain", () => {
    let workspace = createEmptyWorkspace("w1", now);
    workspace = unwrap(
      addCategory(workspace, { name: "Lieu" }, { now, createId }),
    );
    workspace = unwrap(
      addBudgetItem(
        workspace,
        {
          categoryId: workspace.categories[0]!.id,
          name: "Salle",
          estimatedCents: 100,
        },
        { now, createId },
      ),
    );
    const result = deleteCategory(workspace, workspace.categories[0]!.id, {
      now,
    });
    expect(result.ok).toBe(false);
  });

  it("unlinks budget items and deletes contacts when removing a vendor", () => {
    let workspace = createEmptyWorkspace("w1", now);
    workspace = unwrap(
      addCategory(workspace, { name: "Photo" }, { now, createId }),
    );
    workspace = unwrap(
      addVendor(
        workspace,
        {
          name: "Atelier",
          category: "photographer",
          quoteCents: 320_000,
          depositCents: 80_000,
        },
        { now, createId },
      ),
    );
    const vendorId = workspace.vendors[0]!.id;
    workspace = unwrap(
      addVendorContact(
        workspace,
        {
          vendorId,
          name: "Léa Martin",
          email: "lea@atelier.ca",
          isPrimary: true,
        },
        { now, createId },
      ),
    );
    workspace = unwrap(
      addBudgetItem(
        workspace,
        {
          categoryId: workspace.categories[0]!.id,
          name: "Photo",
          estimatedCents: 320_000,
          vendorId,
        },
        { now, createId },
      ),
    );

    workspace = unwrap(deleteVendor(workspace, vendorId, { now }));
    expect(workspace.vendors).toHaveLength(0);
    expect(workspace.contacts).toHaveLength(0);
    expect(workspace.items[0]!.vendorId).toBeNull();
  });
});

describe("integration status", () => {
  it("is READY_FOR_DATA_INTEGRATION", () => {
    expect(FINANCE_INTEGRATION_STATUS).toBe("READY_FOR_DATA_INTEGRATION");
    expect(() => assertReadyForDataIntegration()).not.toThrow();
  });
});
