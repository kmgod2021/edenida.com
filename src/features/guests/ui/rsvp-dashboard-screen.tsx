import Link from "next/link";

import { dietaryLabel, mealLabel, rsvpStatusLabel } from "@/features/guests/domain/labels";
import { guestPaths, type RouteContext } from "@/features/guests/domain/route-context";
import type { RsvpDashboard, WeddingGuestScope } from "@/features/guests/domain/types";
import { EmptyState } from "@/features/guests/ui/states";

export function RsvpDashboardScreen({
  wedding,
  dashboard,
  ctx,
}: {
  wedding: WeddingGuestScope;
  dashboard: RsvpDashboard;
  ctx: RouteContext;
}) {
  const paths = guestPaths(wedding.id, ctx);
  const stats = [
    ["Personnes invitées", dashboard.invited],
    ["Présents", dashboard.attending],
    ["Absents", dashboard.declined],
    ["En attente", dashboard.awaiting],
    ["Non invités", dashboard.notInvited],
    ["Plus-ones autorisés", dashboard.plusOnesAllowed],
    ["Plus-ones présents", dashboard.plusOnesAttending],
  ] as const;

  return (
    <section aria-labelledby="rsvp-dashboard-title">
      <h1 id="rsvp-dashboard-title" className="font-display text-4xl text-ink sm:text-5xl">
        Réponses
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        Où en sont les réponses pour {wedding.title}. Les comptes suivent la liste
        d&apos;invités de cet espace.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="mt-1 font-display text-4xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="meal-tally">
          <h2 id="meal-tally" className="font-display text-2xl text-ink">
            Repas confirmés
          </h2>
          {dashboard.meals.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Aucun repas confirmé.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {dashboard.meals.map((meal) => (
                <li key={meal.choice} className="flex justify-between gap-4 border-b border-line py-2">
                  <span>{mealLabel(meal.choice)}</span>
                  <span>{meal.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="dietary-tally">
          <h2 id="dietary-tally" className="font-display text-2xl text-ink">
            Restrictions des présents
          </h2>
          {dashboard.dietary.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Aucune restriction enregistrée.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {dashboard.dietary.map((item) => (
                <li
                  key={item.restriction}
                  className="flex justify-between gap-4 border-b border-line py-2"
                >
                  <span>{dietaryLabel(item.restriction)}</span>
                  <span>{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="event-tally" className="mt-10">
        <h2 id="event-tally" className="font-display text-2xl text-ink">
          Événements
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {dashboard.events.map((event) => (
            <li key={event.eventId} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <p className="text-ink">{event.name}</p>
              <p className="text-sm text-ink-muted">
                {event.attending} présents · {event.declined} absents · {event.pending} en attente
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-rsvp" className="mt-10">
        <h2 id="recent-rsvp" className="font-display text-2xl text-ink">
          Dernières réponses
        </h2>
        {dashboard.recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Aucune réponse pour l'instant"
              body="Quand un invité répond, ou quand vous enregistrez une réponse, elle apparaît ici."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {dashboard.recent.map((item) => (
              <li key={`${item.guestId}-${item.submittedAt}`} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <Link href={paths.guest(item.guestId)} className="text-ink underline-offset-4 hover:underline">
                  {item.name}
                </Link>
                <span className="text-sm text-ink-muted">
                  {rsvpStatusLabel(item.status)}
                  {item.source === "couple" ? " · notée par vous" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
