"use client";

import { useActionState, useState } from "react";

import { submitRsvpAction } from "@/features/guests/actions";
import { idleFormState } from "@/features/guests/domain/form-state";
import { dietaryLabel, mealLabel } from "@/features/guests/domain/labels";
import type { RouteContext } from "@/features/guests/domain/route-context";
import {
  DIETARY_RESTRICTIONS,
  MEAL_CHOICES,
  type PublicRsvpView,
} from "@/features/guests/domain/types";
import { FormAlert, RouteFields } from "@/features/guests/ui/fields";
import { buttonClass, fieldClass } from "@/features/guests/ui/styles";

export function PublicRsvpForm({
  slug,
  token,
  view,
  ctx,
}: {
  slug: string;
  token: string;
  view: PublicRsvpView;
  ctx: RouteContext;
}) {
  const [state, action, pending] = useActionState(submitRsvpAction, idleFormState);
  const [status, setStatus] = useState(view.defaults.status);

  return (
    <section aria-labelledby="public-rsvp-title">
      <h1 id="public-rsvp-title" className="font-display text-4xl text-ink sm:text-5xl">
        Bonjour {view.guestFirstName}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        {view.weddingTitle} vous invite à répondre. Cette page ne concerne que vous.
      </p>

      <form action={action} className="mt-8 space-y-8" noValidate>
        <RouteFields ctx={ctx} fields={{ slug, token }} />
        <FormAlert message={state.message} />

        <fieldset>
          <legend className="text-sm font-medium text-ink">Votre réponse</legend>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-ink">
              <input
                type="radio"
                name="status"
                value="attending"
                checked={status === "attending"}
                onChange={() => setStatus("attending")}
              />
              Je serai là
            </label>
            <label className="flex items-center gap-2 text-ink">
              <input
                type="radio"
                name="status"
                value="declined"
                checked={status === "declined"}
                onChange={() => setStatus("declined")}
              />
              Je ne pourrai pas venir
            </label>
          </div>
          {state.fieldErrors.status ? (
            <p className="mt-2 text-sm text-danger">{state.fieldErrors.status}</p>
          ) : null}
        </fieldset>

        {status === "" ? (
          <p className="text-sm text-ink-muted">Indiquez si vous serez présent pour continuer.</p>
        ) : null}

        {status === "attending" ? (
          <div className="space-y-8">
            <fieldset>
              <legend className="font-display text-2xl text-ink">Événements</legend>
              {view.events.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Aucun événement précis n&apos;est associé à cette invitation.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {view.events.map((event) => (
                    <label key={event.id} className="flex items-start gap-2 text-ink">
                      <input
                        type="checkbox"
                        name="attendingEventIds"
                        value={event.id}
                        defaultChecked={view.defaults.attendingEventIds.includes(event.id)}
                        className="mt-1"
                      />
                      <span>
                        {event.name}
                        {event.whenLabel ? (
                          <span className="block text-sm text-ink-muted">{event.whenLabel}</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {view.plusOneAllowed ? (
              <fieldset className="space-y-4">
                <legend className="font-display text-2xl text-ink">Accompagnant</legend>
                <label className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    name="plusOneAttending"
                    value="true"
                    defaultChecked={view.defaults.plusOneAttending}
                  />
                  Mon accompagnant sera là
                </label>
                <div className="space-y-2">
                  <label htmlFor="plusOneName" className="block text-sm font-medium text-ink">
                    Nom de l&apos;accompagnant
                  </label>
                  <input
                    id="plusOneName"
                    name="plusOneName"
                    defaultValue={view.defaults.plusOneName}
                    autoComplete="off"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="plusOneMealChoice" className="block text-sm font-medium text-ink">
                    Repas de l&apos;accompagnant
                  </label>
                  <select
                    id="plusOneMealChoice"
                    name="plusOneMealChoice"
                    defaultValue={view.defaults.plusOneMealChoice}
                    className={fieldClass}
                  >
                    {MEAL_CHOICES.map((choice) => (
                      <option key={choice} value={choice}>
                        {mealLabel(choice)}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
            ) : null}

            <fieldset className="space-y-4">
              <legend className="font-display text-2xl text-ink">Repas</legend>
              <div className="space-y-2">
                <label htmlFor="mealChoice" className="block text-sm font-medium text-ink">
                  Choix de repas
                </label>
                <select
                  id="mealChoice"
                  name="mealChoice"
                  defaultValue={view.defaults.mealChoice}
                  className={fieldClass}
                >
                  {MEAL_CHOICES.map((choice) => (
                    <option key={choice} value={choice}>
                      {mealLabel(choice)}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Restrictions alimentaires</legend>
                <div className="mt-3 grid gap-2">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <label key={restriction} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="dietary"
                        value={restriction}
                        defaultChecked={view.defaults.dietary.includes(restriction)}
                      />
                      {dietaryLabel(restriction)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <label htmlFor="dietaryNote" className="block text-sm font-medium text-ink">
                  Précision alimentaire
                </label>
                <textarea
                  id="dietaryNote"
                  name="dietaryNote"
                  rows={3}
                  defaultValue={view.defaults.dietaryNote}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="allergies" className="block text-sm font-medium text-ink">
                  Allergies
                </label>
                <input
                  id="allergies"
                  name="allergies"
                  defaultValue={view.defaults.allergies}
                  className={fieldClass}
                />
              </div>
            </fieldset>
          </div>
        ) : null}

        {status !== "" ? (
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-ink">
              Un mot pour les mariés (facultatif)
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              defaultValue={view.defaults.message}
              className={fieldClass}
            />
          </div>
        ) : null}

        <button type="submit" className={buttonClass} disabled={pending || status === ""}>
          {pending ? "Envoi…" : "Envoyer ma réponse"}
        </button>
      </form>
    </section>
  );
}
