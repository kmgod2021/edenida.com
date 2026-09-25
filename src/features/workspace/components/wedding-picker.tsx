import Link from "next/link";

import { formatWeddingDate } from "../domain/dates";
import type { Wedding } from "../domain/types";
import { accentLinkClass, focusRing } from "./classes";

export function WeddingPicker({ weddings }: { weddings: readonly Wedding[] }) {
  return (
    <section>
      <h1 className="font-display text-5xl text-ink">Vos mariages</h1>
      <p className="mt-3 text-ink-muted">
        Choisissez l&apos;espace à ouvrir.
      </p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {weddings.map((wedding) => (
          <li key={wedding.id}>
            <Link
              href={`/app/weddings/${wedding.id}`}
              className={`flex items-baseline justify-between gap-4 py-4 text-ink ${focusRing}`}
            >
              <span className="text-lg">{wedding.title}</span>
              <span className="shrink-0 text-sm text-ink-muted">
                {wedding.weddingDate
                  ? formatWeddingDate(wedding.weddingDate)
                  : "Date à choisir"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/app/weddings/new" className={`${accentLinkClass} mt-8`}>
        Créer un autre mariage
      </Link>
    </section>
  );
}
