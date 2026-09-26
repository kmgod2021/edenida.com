import Link from "next/link";

import { countdownCopy } from "../domain/dates";
import { quietLinkClass } from "./classes";

export function WeddingCountdown({
  daysUntil,
  settingsHref,
}: {
  daysUntil: number | null;
  settingsHref: string;
}) {
  const copy = countdownCopy(daysUntil);
  return (
    <section aria-labelledby="countdown-heading" className="mt-10">
      <h2 id="countdown-heading" className="text-sm text-ink-muted">
        Compte à rebours
      </h2>
      <div role="status" aria-label="Compte à rebours" className="mt-2">
        <p className="font-display text-6xl leading-none tracking-tight text-ink md:text-7xl">
          {copy.primary}
        </p>
        <p className="mt-2 text-ink-muted">{copy.secondary}</p>
        <span className="sr-only">{copy.label}</span>
      </div>
      {daysUntil === null ? (
        <Link href={settingsHref} className={`${quietLinkClass} mt-4 inline-block`}>
          Ajouter une date
        </Link>
      ) : null}
    </section>
  );
}
