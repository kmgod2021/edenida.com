/**
 * Finance feature barrel — server-safe exports only.
 * Import the interactive shell from `@/features/finance/components/finance-app`.
 */

export { FINANCE_INTEGRATION_STATUS, assertReadyForDataIntegration } from "./integration-status";

export type {
  BudgetCategory,
  BudgetItem,
  Payment,
  Vendor,
  VendorContact,
  VendorCategory,
  VendorStatus,
  FinanceWorkspace,
  WeddingFinanceRollup,
  ItemMoney,
  VendorMoney,
  FinanceCurrency,
} from "./domain/types";

export {
  budgetCategorySchema,
  budgetItemSchema,
  paymentSchema,
  vendorSchema,
  vendorContactSchema,
  financeWorkspaceSchema,
} from "./domain/schemas";

export { formatMoney, parseMoneyInput } from "./domain/money";

export {
  createEmptyWorkspace,
  createFixedIdFactory,
  createId,
  itemMoney,
  paidCentsForItem,
  rollupWorkspace,
  todayIso,
  vendorMoney,
  isItemOverdue,
  isPaymentOverdue,
} from "./domain/workspace";

export * from "./domain/commands";

export {
  DEMO_FINANCE_WEDDING_ID,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_LABELS,
  VENDOR_STATUSES,
} from "./domain/labels";

export { createSampleWorkspace } from "./fixtures/sample-workspace";

export type { FinanceRepository } from "./persistence/port";
export { financeStorageKey, FINANCE_STORAGE_KEY_PREFIX } from "./persistence/port";
export { MemoryFinanceRepository } from "./persistence/memory-repository";
export { LocalStorageFinanceRepository } from "./persistence/local-storage-repository";
export { FinancePersistenceError } from "./persistence/errors";
export {
  FINANCE_HANDOFF_NOTES,
  FINANCE_HANDOFF_TABLES,
} from "./persistence/handoff";
