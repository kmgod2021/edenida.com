"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import {
  defaultGuestListQuery,
  filterGuests,
  groupOptions,
  type GuestListQuery,
} from "@/features/guests/domain/guest-filters";
import {
  countNoun,
  dietaryLabel,
  guestName,
  mealLabel,
  sideLabel,
} from "@/features/guests/domain/labels";
import { guestPaths, type RouteContext } from "@/features/guests/domain/route-context";
import {
  GUEST_SIDES,
  INVITATION_STATUSES,
  RSVP_STATUSES,
  type GuestListItem,
  type HouseholdListItem,
  type WeddingGuestScope,
} from "@/features/guests/domain/types";
import { InvitationBadge, RsvpBadge } from "@/features/guests/ui/status-badge";
import { EmptyState } from "@/features/guests/ui/states";
import { buttonClass, fieldClass } from "@/features/guests/ui/styles";

export function GuestListScreen({
  wedding,
  guests,
  households,
  ctx,
}: {
  wedding: WeddingGuestScope;
  guests: GuestListItem[];
  households: HouseholdListItem[];
  ctx: RouteContext;
}) {
  const [query, setQuery] = useState<GuestListQuery>(defaultGuestListQuery);
  const paths = guestPaths(wedding.id, ctx);
  const visible = useMemo(() => filterGuests(guests, query), [guests, query]);
  const groups = groupOptions(guests);

  function update<K extends keyof GuestListQuery>(key: K, value: GuestListQuery[K]) {
    setQuery((current) => ({ ...current, [key]: value }));
  }

  return (
    <section aria-labelledby="guest-list-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="guest-list-title" className="font-display text-4xl text-ink sm:text-5xl">
            Invités
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
            La liste de {wedding.title}. Recherchez, filtrez, puis ouvrez une fiche
            pour le repas, les régimes et les événements.
          </p>
        </div>
        <Link href={paths.create()} className={buttonClass}>
          Ajouter un invité
        </Link>
      </div>

      <form
        role="search"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <label htmlFor="guest-search" className="block text-sm font-medium text-ink">
            Rechercher
          </label>
          <input
            id="guest-search"
            value={query.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Nom, e-mail ou groupe"
            className={fieldClass}
          />
        </div>
        <FilterSelect
          id="filter-rsvp"
          label="Statut RSVP"
          value={query.rsvpStatus}
          onChange={(value) => update("rsvpStatus", value as GuestListQuery["rsvpStatus"])}
        >
          <option value="all">Tous les statuts</option>
          {RSVP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "pending" ? "En attente" : status === "attending" ? "Présent" : "Absent"}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-invitation"
          label="Invitation"
          value={query.invitationStatus}
          onChange={(value) =>
            update("invitationStatus", value as GuestListQuery["invitationStatus"])
          }
        >
          <option value="all">Toutes</option>
          {INVITATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "not_invited"
                ? "Non invité"
                : status === "save_the_date"
                  ? "Save the date"
                  : "Invité"}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-side"
          label="Côté"
          value={query.side}
          onChange={(value) => update("side", value as GuestListQuery["side"])}
        >
          <option value="all">Tous les côtés</option>
          {GUEST_SIDES.map((side) => (
            <option key={side} value={side}>
              {sideLabel(side, wedding)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-group"
          label="Groupe"
          value={query.groupLabel}
          onChange={(value) => update("groupLabel", value)}
        >
          <option value="all">Tous les groupes</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-household"
          label="Foyer"
          value={query.householdId}
          onChange={(value) => update("householdId", value as GuestListQuery["householdId"])}
        >
          <option value="all">Tous les foyers</option>
          <option value="none">Sans foyer</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-sort"
          label="Trier"
          value={query.sort}
          onChange={(value) => update("sort", value as GuestListQuery["sort"])}
        >
          <option value="name">Nom</option>
          <option value="rsvp">Statut RSVP</option>
        </FilterSelect>
      </form>

      <p aria-live="polite" className="mt-4 text-sm text-ink-muted">
        {countNoun(visible.length, "invité affiché", "invités affichés")} sur {guests.length}
      </p>

      {guests.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Aucun invité pour l'instant"
            body="Ajoutez une première personne, ou créez un foyer pour regrouper une famille."
            action={
              <Link href={paths.create()} className={buttonClass}>
                Ajouter un invité
              </Link>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-ink-muted">Aucun invité ne correspond à ces filtres.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {visible.map((guest) => {
            const meta = [
              sideLabel(guest.side, wedding),
              guest.householdName,
              guest.groupLabel,
              guest.isChild ? "Enfant" : null,
              guest.plusOne.allowed
                ? guest.plusOne.name
                  ? `Plus-one : ${guest.plusOne.name}`
                  : "Plus-one autorisé"
                : null,
            ].filter(Boolean);
            const food = [
              guest.mealChoice !== "unset" ? mealLabel(guest.mealChoice) : null,
              guest.dietary.length > 0
                ? guest.dietary.map((item) => dietaryLabel(item)).join(", ")
                : null,
            ].filter(Boolean);
            return (
              <li key={guest.id} className="py-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_7.5rem_7.5rem_minmax(0,1fr)] sm:items-center">
                  <div className="min-w-0">
                    <Link
                      href={paths.guest(guest.id)}
                      className="text-lg text-ink underline-offset-4 hover:underline"
                    >
                      {guestName(guest)}
                    </Link>
                    <p className="mt-1 text-sm text-ink-muted">{meta.join(" · ")}</p>
                  </div>
                  <RsvpBadge status={guest.rsvpStatus} />
                  <InvitationBadge status={guest.invitationStatus} />
                  <p className="text-sm text-ink-muted">{food.join(" · ") || "Repas non précisé"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        {children}
      </select>
    </div>
  );
}
