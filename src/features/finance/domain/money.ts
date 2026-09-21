/**
 * Money helpers use integer cents.
 * formatMoney avoids Intl to keep Vitest assertions stable (no NBSP / narrow NBSP).
 */

export function formatMoney(cents: number, currency = "CAD"): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const body = `${grouped},${String(remainder).padStart(2, "0")} ${currency}`;
  return negative ? `-${body}` : body;
}

/**
 * Parses a French-style dollar amount string into cents.
 * Accepts: "7500", "7 500", "7500,50", "7 500.50", "-10".
 */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\u00a0/g, " ").replace(/\s/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

export function centsOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
