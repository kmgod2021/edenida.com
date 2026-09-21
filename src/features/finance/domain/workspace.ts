import type {
  BudgetItem,
  CreateId,
  FinanceWorkspace,
  ItemMoney,
  Payment,
  Vendor,
  VendorMoney,
  WeddingFinanceRollup,
} from "./types";

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createFixedIdFactory(prefix = "id"): CreateId {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}_${String(counter).padStart(3, "0")}`;
  };
}

export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function createEmptyWorkspace(
  weddingId: string,
  now: Date = new Date(),
): FinanceWorkspace {
  return {
    schemaVersion: 1,
    weddingId,
    currency: "CAD",
    totalBudgetCents: 0,
    categories: [],
    items: [],
    payments: [],
    vendors: [],
    contacts: [],
    updatedAt: nowIso(now),
  };
}

export function touchWorkspace(
  workspace: FinanceWorkspace,
  now: Date,
): FinanceWorkspace {
  return { ...workspace, updatedAt: nowIso(now) };
}

export function paidCentsForItem(
  itemId: string,
  payments: Payment[],
): number {
  return payments
    .filter((payment) => payment.budgetItemId === itemId && payment.paidOn)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
}

export function itemMoney(
  item: BudgetItem,
  payments: Payment[],
): ItemMoney {
  const paidCents = paidCentsForItem(item.id, payments);
  return {
    estimatedCents: item.estimatedCents,
    committedCents: item.committedCents,
    paidCents,
    remainingCents: item.committedCents - paidCents,
  };
}

export function vendorMoney(vendor: Vendor): VendorMoney {
  if (vendor.quoteCents === null) {
    return {
      quoteCents: null,
      depositCents: vendor.depositCents,
      balanceCents: null,
    };
  }
  return {
    quoteCents: vendor.quoteCents,
    depositCents: vendor.depositCents,
    balanceCents: vendor.quoteCents - vendor.depositCents,
  };
}

export function rollupWorkspace(
  workspace: FinanceWorkspace,
): WeddingFinanceRollup {
  const estimatedTotalCents = workspace.items.reduce(
    (sum, item) => sum + item.estimatedCents,
    0,
  );
  const committedTotalCents = workspace.items.reduce(
    (sum, item) => sum + item.committedCents,
    0,
  );
  const paidTotalCents = workspace.payments
    .filter((payment) => payment.paidOn)
    .reduce((sum, payment) => sum + payment.amountCents, 0);

  return {
    estimatedTotalCents,
    committedTotalCents,
    paidTotalCents,
    remainingToPayCents: committedTotalCents - paidTotalCents,
    budgetRemainingCents: workspace.totalBudgetCents - committedTotalCents,
    overUnderCents: workspace.totalBudgetCents - estimatedTotalCents,
  };
}

export function isDateOverdue(dueOn: string | null, today: string): boolean {
  return Boolean(dueOn && dueOn < today);
}

export function isPaymentOverdue(payment: Payment, today: string): boolean {
  return !payment.paidOn && isDateOverdue(payment.dueOn, today);
}

export function isItemOverdue(
  item: BudgetItem,
  payments: Payment[],
  today: string,
): boolean {
  const remaining = itemMoney(item, payments).remainingCents;
  return remaining > 0 && isDateOverdue(item.dueOn, today);
}
