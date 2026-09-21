/**
 * Wave A completion gate for Track 7 (Budget + Vendors).
 * Persistence is feature-local (memory / localStorage). Supabase adapter + RLS
 * remain deferred — see persistence/handoff.ts.
 */
export const FINANCE_INTEGRATION_STATUS =
  "READY_FOR_DATA_INTEGRATION" as const;

export type FinanceIntegrationStatus = typeof FINANCE_INTEGRATION_STATUS;

export function assertReadyForDataIntegration(
  status: string = FINANCE_INTEGRATION_STATUS,
): asserts status is FinanceIntegrationStatus {
  if (status !== FINANCE_INTEGRATION_STATUS) {
    throw new Error(
      `Expected finance integration status ${FINANCE_INTEGRATION_STATUS}, got ${status}`,
    );
  }
}
