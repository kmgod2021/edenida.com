/**
 * Architecture handoff — Finance Wave A → persistence / Supabase track
 * ----------------------------------------------------------------------
 * Status: READY_FOR_DATA_INTEGRATION
 *
 * This feature ships with:
 * - Domain contracts (BudgetCategory, BudgetItem, Payment, Vendor, VendorContact)
 * - Pure command layer + rollups (paid / remaining / balance derived)
 * - MemoryFinanceRepository + LocalStorageFinanceRepository
 * - UI at /app/finance (local demo wedding id)
 *
 * Explicitly NOT in this branch (FORBIDDEN_SCOPE):
 * - supabase/migrations/**
 * - Auth / RLS policies
 * - package.json dependency changes
 *
 * Proposed tables (for a future migration — do not invent here):
 * - budget_categories (wedding_id, name, sort_order, timestamps)
 * - budget_items (
 *     wedding_id, category_id, vendor_id nullable,
 *     name, estimated_cents, committed_cents, due_on, notes
 *   )
 * - payments (
 *     wedding_id, budget_item_id, amount_cents,
 *     due_on, paid_on, label, notes
 *   )
 * - vendors (
 *     wedding_id, name, category, status,
 *     quote_cents nullable, deposit_cents, notes, website
 *   )
 * - vendor_contacts (
 *     wedding_id, vendor_id, name, role, email, phone, is_primary
 *   )
 *
 * Money: integer cents. Never store paid/remaining/balance — derive in app/SQL views.
 * Tenancy: every row has wedding_id; RLS via is_wedding_member(wedding_id).
 * Client: user-scoped Supabase session only — never service_role in browser.
 * Adapter shape: implement FinanceRepository.load/save against Supabase,
 * then swap LocalStorageFinanceRepository in FinanceApp props / DI.
 *
 * Replace local demo wedding id with real Phase 3 wedding workspace route
 * once wedding CRUD lands: /(app)/w/[weddingId]/finance.
 */

export const FINANCE_HANDOFF_TABLES = [
  "budget_categories",
  "budget_items",
  "payments",
  "vendors",
  "vendor_contacts",
] as const;

export const FINANCE_HANDOFF_NOTES = {
  moneyUnit: "integer_cents",
  derivedFields: ["paid", "remaining", "vendor_balance"] as const,
  rlsHelper: "is_wedding_member(wedding_id)",
  forbidServiceRoleInBrowser: true,
  targetRoute: "/(app)/w/[weddingId]/finance",
} as const;
