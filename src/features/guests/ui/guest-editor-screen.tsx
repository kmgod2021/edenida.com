"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { deleteGuestAction, saveGuestAction } from "@/features/guests/actions";
import { idleFormState } from "@/features/guests/domain/form-state";
import {
  dietaryLabel,
  guestName,
  invitationLinkLabel,
  mealLabel,
  rsvpStatusLabel,
  sideLabel,
} from "@/features/guests/domain/labels";
import { guestPaths, type RouteContext } from "@/features/guests/domain/route-context";
import {
  DIETARY_RESTRICTIONS,
  GUEST_SIDES,
  INVITATION_STATUSES,
  MEAL_CHOICES,
  RSVP_STATUSES,
  type GuestDetail,
  type HouseholdListItem,
  type WeddingGuestScope,
} from "@/features/guests/domain/types";
import { FieldError, FormAlert, RouteFields, SelectField, TextField } from "@/features/guests/ui/fields";
import { buttonClass, fieldClass, secondaryButtonClass } from "@/features/guests/ui/styles";

export function GuestEditorScreen({
  wedding,
  guest,
  households,
  ctx,
}: {
  wedding: WeddingGuestScope;
  guest: GuestDetail | null;
  households: HouseholdListItem[];
  ctx: RouteContext;
}) {
  const [state, action, pending] = useActionState(saveGuestAction, idleFormState);
  const paths = guestPaths(wedding.id, ctx);
  const plusOne = guest?.plusOne;
  const title = guest ? guestName(guest) : "Nouvel invité";

  return (
    <section aria-labelledby="guest-editor-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="guest-editor-title" className="font-display text-4xl text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Identité, foyer, plus-one, repas et événements. Les notes privées restent
            dans l&apos;espace mariage.
          </p>
        </div>
        <Link href={paths.list()} className="text-sm text-ink-muted underline-offset-4 hover:underline">
          Retour à la liste
        </Link>
      </div>

      <form action={action} className="mt-8 space-y-10" noValidate>
        <RouteFields
          ctx={ctx}
          fields={{ weddingId: wedding.id, id: guest?.id ?? "" }}
        />
        <FormAlert message={state.message} />

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl text-ink">Identité</legend>
          <TextField
            id="firstName"
            name="firstName"
            label="Prénom"
            autoComplete="given-name"
            defaultValue={guest?.firstName}
            error={state.fieldErrors.firstName}
          />
          <TextField
            id="lastName"
            name="lastName"
            label="Nom"
            autoComplete="family-name"
            defaultValue={guest?.lastName}
            error={state.fieldErrors.lastName}
          />
          <TextField
            id="email"
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            defaultValue={guest?.email ?? ""}
            error={state.fieldErrors.email}
          />
          <TextField
            id="phone"
            name="phone"
            type="tel"
            label="Téléphone"
            autoComplete="tel"
            defaultValue={guest?.phone ?? ""}
            error={state.fieldErrors.phone}
          />
          <SelectField id="side" name="side" label="Côté" defaultValue={guest?.side ?? "unspecified"}>
            {GUEST_SIDES.map((side) => (
              <option key={side} value={side}>
                {sideLabel(side, wedding)}
              </option>
            ))}
          </SelectField>
          <TextField
            id="groupLabel"
            name="groupLabel"
            label="Groupe"
            defaultValue={guest?.groupLabel ?? ""}
            error={state.fieldErrors.groupLabel}
          />
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              name="isChild"
              value="true"
              defaultChecked={guest?.isChild ?? false}
            />
            Enfant
          </label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl text-ink">Foyer et invitation</legend>
          <SelectField
            id="householdId"
            name="householdId"
            label="Foyer"
            defaultValue={guest?.householdId ?? ""}
            error={state.fieldErrors.householdId}
          >
            <option value="">Aucun</option>
            {households.map((household) => (
              <option key={household.id} value={household.id}>
                {household.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="invitationStatus"
            name="invitationStatus"
            label="Invitation"
            defaultValue={guest?.invitationStatus ?? "invited"}
            error={state.fieldErrors.invitationStatus}
          >
            {INVITATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "not_invited"
                  ? "Non invité"
                  : status === "save_the_date"
                    ? "Save the date"
                    : "Invité"}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="rsvpStatus"
            name="rsvpStatus"
            label="Statut RSVP"
            defaultValue={guest?.rsvpStatus ?? "pending"}
            error={state.fieldErrors.rsvpStatus}
          >
            {RSVP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {rsvpStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          <div className="space-y-2 sm:col-span-2">
            <fieldset>
              <legend className="text-sm font-medium text-ink">Événements invités</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {wedding.events.map((event) => (
                  <label key={event.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="eventIds"
                      value={event.id}
                      defaultChecked={guest?.eventIds.includes(event.id) ?? false}
                    />
                    {event.name}
                  </label>
                ))}
              </div>
              <FieldError id="eventIds-error" message={state.fieldErrors.eventIds} />
            </fieldset>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl text-ink">Plus-one</legend>
          <p className="text-sm leading-relaxed text-ink-muted sm:col-span-2">
            Un plus-one autorisé reste un accompagnant. Il ne devient pas une fiche
            invité tant que cette décision n&apos;est pas prise avec les données.
          </p>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              name="plusOneAllowed"
              value="true"
              defaultChecked={plusOne?.allowed ?? false}
            />
            Autoriser un plus-one
          </label>
          <TextField
            id="plusOneName"
            name="plusOneName"
            label="Nom du plus-one"
            defaultValue={plusOne?.name ?? ""}
            error={state.fieldErrors.plusOneName}
          />
          <SelectField
            id="plusOneMealChoice"
            name="plusOneMealChoice"
            label="Repas de l'accompagnant"
            defaultValue={guest?.latestRsvp?.plusOneMealChoice ?? "unset"}
          >
            {MEAL_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {mealLabel(choice)}
              </option>
            ))}
          </SelectField>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              name="plusOneAttending"
              value="true"
              defaultChecked={guest?.latestRsvp?.plusOneAttending ?? false}
            />
            L&apos;accompagnant sera présent
          </label>
          <FieldError id="plusOneAttending-error" message={state.fieldErrors.plusOneAttending} />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl text-ink">Repas et restrictions</legend>
          <SelectField
            id="mealChoice"
            name="mealChoice"
            label="Choix de repas"
            defaultValue={guest?.mealChoice ?? "unset"}
            error={state.fieldErrors.mealChoice}
          >
            {MEAL_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {mealLabel(choice)}
              </option>
            ))}
          </SelectField>
          <TextField
            id="allergies"
            name="allergies"
            label="Allergies"
            defaultValue={guest?.allergies ?? ""}
            error={state.fieldErrors.allergies}
          />
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-ink">Restrictions alimentaires</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <label key={restriction} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="dietary"
                    value={restriction}
                    defaultChecked={guest?.dietary.includes(restriction) ?? false}
                  />
                  {dietaryLabel(restriction)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="dietaryNote" className="block text-sm font-medium text-ink">
              Précision alimentaire
            </label>
            <textarea
              id="dietaryNote"
              name="dietaryNote"
              rows={3}
              defaultValue={guest?.dietaryNote ?? ""}
              className={fieldClass}
            />
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="privateNotes" className="block text-sm font-medium text-ink">
            Notes privées
          </label>
          <textarea
            id="privateNotes"
            name="privateNotes"
            rows={4}
            defaultValue={guest?.privateNotes ?? ""}
            className={fieldClass}
          />
          <p className="text-sm text-ink-muted">
            Visibles uniquement par l&apos;équipe du mariage, jamais sur le RSVP public.
          </p>
        </div>

        {guest && guest.invitations.length > 0 ? (
          <div>
            <h2 className="font-display text-2xl text-ink">Liens d&apos;invitation</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Le jeton n&apos;est pas affiché. Son format reste une proposition pour la revue
              sécurité.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {guest.invitations.map((invitation) => (
                <li key={invitation.id}>{invitationLinkLabel(invitation.status)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {guest?.latestRsvp ? (
          <div>
            <h2 className="font-display text-2xl text-ink">Réponse par événement</h2>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {guest.eventIds.map((eventId) => {
                const event = wedding.events.find((item) => item.id === eventId);
                const answer = guest.latestRsvp?.answers.find((item) => item.eventId === eventId);
                const label = !answer ? "Sans réponse" : answer.attending ? "Présent" : "Absent";
                return (
                  <li key={eventId}>
                    {event?.name ?? "Événement"} : {label}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className={buttonClass} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <Link href={paths.list()} className={secondaryButtonClass}>
            Annuler
          </Link>
        </div>
      </form>

      {guest ? <DeleteGuest weddingId={wedding.id} guest={guest} ctx={ctx} /> : null}
    </section>
  );
}

function DeleteGuest({
  weddingId,
  guest,
  ctx,
}: {
  weddingId: string;
  guest: GuestDetail;
  ctx: RouteContext;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <div className="mt-12 border-t border-line pt-6">
        <button type="button" className={secondaryButtonClass} onClick={() => setConfirming(true)}>
          Retirer de la liste
        </button>
      </div>
    );
  }
  return (
    <form action={deleteGuestAction} className="mt-12 space-y-4 border-t border-line pt-6">
      <RouteFields ctx={ctx} fields={{ weddingId, guestId: guest.id }} />
      <p className="text-sm text-ink">
        Retirer {guestName(guest)} de la liste ? Cette action ne prévient pas l&apos;invité.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={buttonClass}>
          Confirmer le retrait
        </button>
        <button type="button" className={secondaryButtonClass} onClick={() => setConfirming(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
