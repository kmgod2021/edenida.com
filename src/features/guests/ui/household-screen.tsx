"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveHouseholdAction } from "@/features/guests/actions";
import { idleFormState } from "@/features/guests/domain/form-state";
import { guestName } from "@/features/guests/domain/labels";
import { guestPaths, type RouteContext } from "@/features/guests/domain/route-context";
import type { HouseholdListItem, WeddingGuestScope } from "@/features/guests/domain/types";
import { FormAlert, RouteFields, TextField } from "@/features/guests/ui/fields";
import { EmptyState } from "@/features/guests/ui/states";
import { buttonClass, secondaryButtonClass } from "@/features/guests/ui/styles";

export function HouseholdScreen({
  wedding,
  households,
  ctx,
}: {
  wedding: WeddingGuestScope;
  households: HouseholdListItem[];
  ctx: RouteContext;
}) {
  const [state, action, pending] = useActionState(saveHouseholdAction, idleFormState);
  const paths = guestPaths(wedding.id, ctx);

  return (
    <section aria-labelledby="household-title">
      <h1 id="household-title" className="font-display text-4xl text-ink sm:text-5xl">
        Foyers
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        Regroupez les invités qui partagent une adresse ou une invitation familiale.
      </p>

      <form action={action} className="mt-8 grid gap-4 border border-line bg-bg-elevated/70 p-5 sm:grid-cols-2">
        <RouteFields ctx={ctx} fields={{ weddingId: wedding.id, id: "" }} />
        <div className="sm:col-span-2">
          <h2 className="font-display text-2xl text-ink">Nouveau foyer</h2>
        </div>
        <FormAlert message={state.message} />
        <TextField
          id="household-name"
          name="name"
          label="Nom du foyer"
          error={state.fieldErrors.name}
        />
        <TextField
          id="household-address"
          name="address"
          label="Adresse"
          autoComplete="street-address"
          error={state.fieldErrors.address}
        />
        <div>
          <button type="submit" className={buttonClass} disabled={pending}>
            {pending ? "Enregistrement…" : "Ajouter le foyer"}
          </button>
        </div>
      </form>

      {households.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Aucun foyer pour l'instant"
            body="Créez un foyer pour rassembler une famille, puis rattachez les invités depuis leur fiche."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-8">
          {households.map((household) => (
            <li key={household.id} className="border-t border-line pt-6">
              <HouseholdEditor weddingId={wedding.id} household={household} ctx={ctx} />
              {household.members.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">Aucune personne dans ce foyer.</p>
              ) : (
                <ul className="mt-4 space-y-1">
                  {household.members.map((member) => (
                    <li key={member.id}>
                      <Link
                        href={paths.guest(member.id)}
                        className="text-ink underline-offset-4 hover:underline"
                      >
                        {guestName(member)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HouseholdEditor({
  weddingId,
  household,
  ctx,
}: {
  weddingId: string;
  household: HouseholdListItem;
  ctx: RouteContext;
}) {
  const [state, action, pending] = useActionState(saveHouseholdAction, idleFormState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <RouteFields ctx={ctx} fields={{ weddingId, id: household.id }} />
      <div className="sm:col-span-2">
        <h2 className="font-display text-2xl text-ink">{household.name}</h2>
        <FormAlert message={state.message} />
      </div>
      <div className="space-y-2">
        <label htmlFor={`name-${household.id}`} className="block text-sm font-medium text-ink">
          Nom
        </label>
        <input
          id={`name-${household.id}`}
          name="name"
          defaultValue={household.name}
          className="w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`address-${household.id}`} className="block text-sm font-medium text-ink">
          Adresse
        </label>
        <input
          id={`address-${household.id}`}
          name="address"
          defaultValue={household.address ?? ""}
          className="w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
        />
      </div>
      <div>
        <button type="submit" className={secondaryButtonClass} disabled={pending}>
          {pending ? "Enregistrement…" : "Mettre à jour"}
        </button>
      </div>
    </form>
  );
}
