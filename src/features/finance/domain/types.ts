/** Supported wedding currencies for Wave A (CAD default per MVP). */
export type FinanceCurrency = "CAD";

export type VendorStatus =
  | "considering"
  | "quoted"
  | "booked"
  | "paid"
  | "declined";

/** Common vendor categories for the personal CRM (not a marketplace). */
export type VendorCategory =
  | "venue"
  | "photographer"
  | "videographer"
  | "caterer"
  | "florist"
  | "music"
  | "cake"
  | "attire"
  | "planner"
  | "other";

export type BudgetCategory = {
  id: string;
  weddingId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Budget line item.
 * - estimatedCents: planned cost
 * - committedCents: accepted quote / contracted amount (0 before booking)
 * Paid amount is derived from Payment rows with paidOn set.
 * Remaining = committedCents − paidCents (may be negative on overpay).
 */
export type BudgetItem = {
  id: string;
  weddingId: string;
  categoryId: string;
  vendorId: string | null;
  name: string;
  estimatedCents: number;
  committedCents: number;
  dueOn: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Payment against a budget item.
 * Status is derived: paid when paidOn is set; overdue when dueOn is past and unpaid.
 */
export type Payment = {
  id: string;
  weddingId: string;
  budgetItemId: string;
  amountCents: number;
  dueOn: string | null;
  paidOn: string | null;
  label: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Vendor CRM record.
 * balanceCents is computed as quoteCents − depositCents (null when quote is null).
 */
export type Vendor = {
  id: string;
  weddingId: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  quoteCents: number | null;
  depositCents: number;
  notes: string;
  website: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorContact = {
  id: string;
  weddingId: string;
  vendorId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Aggregate wedding finance workspace (feature-local until Supabase adapter). */
export type FinanceWorkspace = {
  schemaVersion: 1;
  weddingId: string;
  currency: FinanceCurrency;
  totalBudgetCents: number;
  categories: BudgetCategory[];
  items: BudgetItem[];
  payments: Payment[];
  vendors: Vendor[];
  contacts: VendorContact[];
  updatedAt: string;
};

export type WeddingFinanceRollup = {
  estimatedTotalCents: number;
  committedTotalCents: number;
  paidTotalCents: number;
  remainingToPayCents: number;
  budgetRemainingCents: number;
  overUnderCents: number;
};

export type ItemMoney = {
  estimatedCents: number;
  committedCents: number;
  paidCents: number;
  remainingCents: number;
};

export type VendorMoney = {
  quoteCents: number | null;
  depositCents: number;
  balanceCents: number | null;
};

export type CreateId = () => string;
