import { formatMoney } from "../domain/money";
import type { WeddingFinanceRollup } from "../domain/types";

type MoneySummaryProps = {
  rollup: WeddingFinanceRollup;
  totalBudgetCents: number;
  currency?: string;
};

function Stat({
  label,
  valueCents,
  currency,
  tone = "default",
}: {
  label: string;
  valueCents: number;
  currency: string;
  tone?: "default" | "warn" | "ok";
}) {
  const toneClass =
    tone === "warn"
      ? "text-danger"
      : tone === "ok"
        ? "text-accent-2"
        : "text-ink";

  return (
    <div className="rounded-md border border-line bg-bg-elevated px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-lg font-medium tabular-nums ${toneClass}`}>
        {formatMoney(valueCents, currency)}
      </p>
    </div>
  );
}

export function MoneySummary({
  rollup,
  totalBudgetCents,
  currency = "CAD",
}: MoneySummaryProps) {
  return (
    <section aria-label="Résumé budgétaire" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Budget total"
          valueCents={totalBudgetCents}
          currency={currency}
        />
        <Stat
          label="Estimé"
          valueCents={rollup.estimatedTotalCents}
          currency={currency}
        />
        <Stat
          label="Engagé"
          valueCents={rollup.committedTotalCents}
          currency={currency}
        />
        <Stat
          label="Payé"
          valueCents={rollup.paidTotalCents}
          currency={currency}
          tone="ok"
        />
        <Stat
          label="Reste à payer"
          valueCents={rollup.remainingToPayCents}
          currency={currency}
          tone={rollup.remainingToPayCents > 0 ? "warn" : "ok"}
        />
        <Stat
          label="Marge budget"
          valueCents={rollup.budgetRemainingCents}
          currency={currency}
          tone={rollup.budgetRemainingCents < 0 ? "warn" : "default"}
        />
      </div>
      <p className="text-sm text-ink-muted">
        Écart budget vs estimé :{" "}
        <span className="font-medium text-ink">
          {formatMoney(rollup.overUnderCents, currency)}
        </span>
      </p>
    </section>
  );
}
