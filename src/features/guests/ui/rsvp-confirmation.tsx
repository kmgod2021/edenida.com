import Link from "next/link";

import { dietaryLabel, mealLabel } from "@/features/guests/domain/labels";
import { publicRsvpPath, type RouteContext } from "@/features/guests/domain/route-context";
import type { RsvpConfirmation } from "@/features/guests/domain/types";

export function RsvpConfirmationView({
  slug,
  token,
  ctx,
  weddingTitle,
  guestFirstName,
  confirmation,
}: {
  slug: string;
  token: string;
  ctx: RouteContext;
  weddingTitle: string;
  guestFirstName: string;
  confirmation: RsvpConfirmation | null;
}) {
  return (
    <section aria-labelledby="rsvp-confirmation-title">
      <h1 id="rsvp-confirmation-title" className="font-display text-4xl text-ink sm:text-5xl">
        {confirmation ? `Merci, ${guestFirstName}` : `Bonjour ${guestFirstName}`}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        {confirmation
          ? confirmation.status === "attending"
            ? "Votre présence est notée."
            : "Votre réponse est notée. Merci d'avoir prévenu."
          : "Vous n'avez pas encore répondu."}
      </p>
      <p className="mt-2 text-sm text-ink-muted">{weddingTitle}</p>

      {confirmation ? (
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-ink-muted">Réponse</dt>
            <dd className="text-ink">
              {confirmation.status === "attending" ? "Présent" : "Absent"}
            </dd>
          </div>
          {confirmation.status === "attending" ? (
            <div>
              <dt className="text-ink-muted">Repas</dt>
              <dd className="text-ink">{mealLabel(confirmation.mealChoice)}</dd>
            </div>
          ) : null}
          {confirmation.plusOneName ? (
            <div>
              <dt className="text-ink-muted">Accompagnant</dt>
              <dd className="text-ink">
                {confirmation.plusOneName}
                {confirmation.plusOneMealChoice !== "unset"
                  ? ` · ${mealLabel(confirmation.plusOneMealChoice)}`
                  : ""}
              </dd>
            </div>
          ) : null}
          {confirmation.dietary.length > 0 ? (
            <div>
              <dt className="text-ink-muted">Restrictions</dt>
              <dd className="text-ink">
                {confirmation.dietary.map((item) => dietaryLabel(item)).join(", ")}
              </dd>
            </div>
          ) : null}
          {confirmation.eventsAttending.length > 0 ? (
            <div>
              <dt className="text-ink-muted">Événements</dt>
              <dd className="text-ink">
                {confirmation.eventsAttending.map((event) => event.name).join(", ")}
              </dd>
            </div>
          ) : null}
          {confirmation.message ? (
            <div>
              <dt className="text-ink-muted">Votre mot</dt>
              <dd className="text-ink">{confirmation.message}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <p className="mt-8 text-sm leading-relaxed text-ink-muted">
        Vous pouvez fermer cette page. Les mariés voient votre réponse dans leur espace.
      </p>
      <Link
        href={publicRsvpPath(slug, ctx, token)}
        className="mt-6 inline-block text-sm text-accent underline-offset-4 hover:underline"
      >
        Modifier ma réponse
      </Link>
    </section>
  );
}
