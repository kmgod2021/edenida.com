import Link from "next/link";

import { accentLinkClass } from "./classes";

export function OnboardingPanel() {
  return (
    <section className="max-w-xl">
      <p className="text-sm tracking-wide text-ink-muted">Nouveau projet</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-ink">
        Votre mariage commence ici
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        Un seul espace pour le site, les invités, le RSVP, la checklist et le
        budget. Rien n&apos;est public tant que vous ne le publiez pas.
      </p>
      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link href="/app/weddings/new" className={accentLinkClass}>
          Créer le mariage
        </Link>
      </div>
    </section>
  );
}
