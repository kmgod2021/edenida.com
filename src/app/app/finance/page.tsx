import { FinanceApp } from "@/features/finance/components/finance-app";

export const metadata = {
  title: "Budget & prestataires",
};

/**
 * Wave A demo route for Budget + Vendors.
 * Outside the long-term `/(app)/w/[weddingId]/finance` shape until Phase 3
 * wedding workspace exists. Kept minimal so Playwright can exercise the UI.
 */
export default function FinancePage() {
  return <FinanceApp />;
}
