import { PROGRESS_STEP_LABELS, progressStepStatus } from "../domain/labels";
import type { ProgressStep } from "../domain/types";

export function ProgressSummary({
  percent,
  steps,
}: {
  percent: number;
  steps: readonly ProgressStep[];
}) {
  const caption =
    percent === 0
      ? "Le tableau de bord est prêt. Les modules se rempliront au fur et à mesure."
      : percent === 100
        ? "Les bases suivies ici sont en place."
        : `${percent} % des bases suivies ici.`;

  return (
    <section aria-labelledby="progress-heading" className="mt-12">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="progress-heading" className="font-display text-3xl text-ink">
          Avancement
        </h2>
        <p className="text-sm text-ink-muted">{percent} %</p>
      </div>
      <div
        role="meter"
        aria-label="Avancement du mariage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={caption}
        className="mt-4 h-1 w-full bg-line"
      >
        <div
          className="h-1 bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{caption}</p>
      <ol className="mt-4">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-sm"
          >
            <span className="text-ink">{PROGRESS_STEP_LABELS[step.id]}</span>
            <span className="text-ink-muted">{progressStepStatus(step.ratio)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
