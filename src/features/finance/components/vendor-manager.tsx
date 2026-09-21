"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  addVendor,
  addVendorContact,
  deleteVendor,
  deleteVendorContact,
  updateVendor,
  type CommandResult,
} from "../domain/commands";
import {
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_LABELS,
  VENDOR_STATUSES,
} from "../domain/labels";
import { formatMoney, parseMoneyInput } from "../domain/money";
import { vendorMoney } from "../domain/workspace";
import type {
  FinanceWorkspace,
  Vendor,
  VendorCategory,
  VendorStatus,
} from "../domain/types";

type VendorManagerProps = {
  workspace: FinanceWorkspace;
  onWorkspaceChange: (result: CommandResult) => void;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";
const labelClass = "block text-sm text-ink";
const buttonPrimary =
  "inline-flex items-center justify-center rounded-md bg-ink px-3 py-2 text-sm font-medium text-bg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const buttonGhost =
  "inline-flex items-center justify-center rounded-md border border-line px-3 py-2 text-sm text-ink transition hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function VendorManager({
  workspace,
  onWorkspaceChange,
}: VendorManagerProps) {
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | "all">(
    "all",
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("photographer");
  const [status, setStatus] = useState<VendorStatus>("considering");
  const [quote, setQuote] = useState("");
  const [deposit, setDeposit] = useState("");
  const [notes, setNotes] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPrimary, setContactPrimary] = useState(true);
  const [detailNotes, setDetailNotes] = useState("");

  const vendors = useMemo(() => {
    const list =
      categoryFilter === "all"
        ? workspace.vendors
        : workspace.vendors.filter(
            (vendor) => vendor.category === categoryFilter,
          );
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [workspace.vendors, categoryFilter]);

  const selectedVendor =
    workspace.vendors.find((vendor) => vendor.id === selectedVendorId) ?? null;

  const selectedContacts = useMemo(
    () =>
      workspace.contacts.filter(
        (contact) => contact.vendorId === selectedVendorId,
      ),
    [workspace.contacts, selectedVendorId],
  );

  const linkedItems = useMemo(
    () =>
      workspace.items.filter((item) => item.vendorId === selectedVendorId),
    [workspace.items, selectedVendorId],
  );

  function apply(result: CommandResult) {
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormError(null);
    onWorkspaceChange(result);
  }

  function selectVendor(vendor: Vendor) {
    setSelectedVendorId(vendor.id);
    setDetailNotes(vendor.notes);
    setFormError(null);
  }

  function handleAddVendor(event: FormEvent) {
    event.preventDefault();
    const quoteCents = quote.trim() ? parseMoneyInput(quote) : null;
    if (quote.trim() && quoteCents === null) {
      setFormError("Devis invalide.");
      return;
    }
    const depositCents = deposit.trim() ? parseMoneyInput(deposit) : 0;
    if (depositCents === null) {
      setFormError("Dépôt invalide.");
      return;
    }

    const result = addVendor(workspace, {
      name,
      category,
      status,
      quoteCents,
      depositCents,
      notes,
    });
    apply(result);
    if (result.ok) {
      const created = result.workspace.vendors.at(-1);
      setName("");
      setQuote("");
      setDeposit("");
      setNotes("");
      setStatus("considering");
      if (created) {
        setSelectedVendorId(created.id);
        setDetailNotes(created.notes);
      }
    }
  }

  function handleSaveNotes(event: FormEvent) {
    event.preventDefault();
    if (!selectedVendor) return;
    apply(
      updateVendor(workspace, selectedVendor.id, { notes: detailNotes }),
    );
  }

  function handleAddContact(event: FormEvent) {
    event.preventDefault();
    if (!selectedVendor) return;
    const result = addVendorContact(workspace, {
      vendorId: selectedVendor.id,
      name: contactName,
      role: contactRole,
      email: contactEmail,
      phone: contactPhone,
      isPrimary: contactPrimary,
    });
    apply(result);
    if (result.ok) {
      setContactName("");
      setContactRole("");
      setContactEmail("");
      setContactPhone("");
      setContactPrimary(false);
    }
  }

  return (
    <div className="space-y-8">
      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="vendor-filter" className={labelClass}>
            Filtrer par catégorie
          </label>
          <select
            id="vendor-filter"
            className={fieldClass}
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as VendorCategory | "all")
            }
          >
            <option value="all">Toutes</option>
            {VENDOR_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {VENDOR_CATEGORY_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-ink-muted">
          {vendors.length} prestataire{vendors.length === 1 ? "" : "s"}
        </p>
      </div>

      <form
        onSubmit={handleAddVendor}
        className="space-y-3 rounded-md border border-line p-4"
      >
        <h3 className="font-display text-xl text-ink">Nouveau prestataire</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vendor-name" className={labelClass}>
              Nom
            </label>
            <input
              id="vendor-name"
              className={fieldClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="vendor-category" className={labelClass}>
              Catégorie
            </label>
            <select
              id="vendor-category"
              className={fieldClass}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as VendorCategory)
              }
            >
              {VENDOR_CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {VENDOR_CATEGORY_LABELS[entry]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="vendor-status" className={labelClass}>
              Statut
            </label>
            <select
              id="vendor-status"
              className={fieldClass}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VendorStatus)
              }
            >
              {VENDOR_STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {VENDOR_STATUS_LABELS[entry]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="vendor-quote" className={labelClass}>
              Devis
            </label>
            <input
              id="vendor-quote"
              className={fieldClass}
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label htmlFor="vendor-deposit" className={labelClass}>
              Dépôt
            </label>
            <input
              id="vendor-deposit"
              className={fieldClass}
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vendor-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="vendor-notes"
              className={fieldClass}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <button type="submit" className={buttonPrimary}>
          Ajouter le prestataire
        </button>
      </form>

      <section aria-label="Liste des prestataires" className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Prestataires</h3>
        {vendors.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-ink-muted">
            Aucun prestataire pour l&apos;instant. Ajoutez votre photographe,
            lieu ou traiteur.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line">
            {vendors.map((vendor) => {
              const money = vendorMoney(vendor);
              const selected = vendor.id === selectedVendorId;
              return (
                <li key={vendor.id}>
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-bg-elevated sm:flex-row sm:items-center sm:justify-between ${
                      selected ? "bg-bg-elevated" : ""
                    }`}
                    onClick={() => selectVendor(vendor)}
                    aria-current={selected ? "true" : undefined}
                  >
                    <div>
                      <p className="font-medium text-ink">{vendor.name}</p>
                      <p className="text-sm text-ink-muted">
                        {VENDOR_CATEGORY_LABELS[vendor.category]} ·{" "}
                        {VENDOR_STATUS_LABELS[vendor.status]}
                      </p>
                    </div>
                    <div className="text-sm tabular-nums text-ink-muted">
                      {money.quoteCents === null
                        ? "Devis —"
                        : `Devis ${formatMoney(money.quoteCents, workspace.currency)}`}
                      {money.balanceCents !== null
                        ? ` · solde ${formatMoney(money.balanceCents, workspace.currency)}`
                        : ""}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedVendor ? (
        <section
          aria-label={`Détail ${selectedVendor.name}`}
          className="space-y-6 rounded-md border border-line p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-display text-2xl text-ink">
                {selectedVendor.name}
              </h3>
              <p className="text-sm text-ink-muted">
                {VENDOR_CATEGORY_LABELS[selectedVendor.category]} ·{" "}
                {VENDOR_STATUS_LABELS[selectedVendor.status]}
              </p>
            </div>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => {
                apply(deleteVendor(workspace, selectedVendor.id));
                setSelectedVendorId(null);
              }}
            >
              Supprimer
            </button>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Devis
              </dt>
              <dd className="mt-1 tabular-nums text-ink">
                {selectedVendor.quoteCents === null
                  ? "—"
                  : formatMoney(
                      selectedVendor.quoteCents,
                      workspace.currency,
                    )}
              </dd>
            </div>
            <div className="rounded-md border border-line px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Dépôt
              </dt>
              <dd className="mt-1 tabular-nums text-ink">
                {formatMoney(selectedVendor.depositCents, workspace.currency)}
              </dd>
            </div>
            <div className="rounded-md border border-line px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Solde
              </dt>
              <dd className="mt-1 tabular-nums text-ink">
                {vendorMoney(selectedVendor).balanceCents === null
                  ? "—"
                  : formatMoney(
                      vendorMoney(selectedVendor).balanceCents!,
                      workspace.currency,
                    )}
              </dd>
            </div>
          </dl>

          <form onSubmit={handleSaveNotes} className="space-y-3">
            <div>
              <label htmlFor="vendor-detail-notes" className={labelClass}>
                Notes
              </label>
              <textarea
                id="vendor-detail-notes"
                className={fieldClass}
                rows={4}
                value={detailNotes}
                onChange={(event) => setDetailNotes(event.target.value)}
              />
            </div>
            <button type="submit" className={buttonPrimary}>
              Enregistrer les notes
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="font-display text-xl text-ink">Contacts</h4>
            {selectedContacts.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun contact.</p>
            ) : (
              <ul className="space-y-2">
                {selectedContacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex flex-col gap-2 rounded-md border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {contact.name}
                        {contact.isPrimary ? (
                          <span className="ml-2 text-xs text-accent-2">
                            Principal
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {[contact.role, contact.email, contact.phone]
                          .filter(Boolean)
                          .join(" · ") || "Coordonnées non renseignées"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={buttonGhost}
                      onClick={() =>
                        apply(deleteVendorContact(workspace, contact.id))
                      }
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleAddContact}
              className="grid gap-3 rounded-md border border-dashed border-line p-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Nom du contact
                </label>
                <input
                  id="contact-name"
                  className={fieldClass}
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-role" className={labelClass}>
                  Rôle
                </label>
                <input
                  id="contact-role"
                  className={fieldClass}
                  value={contactRole}
                  onChange={(event) => setContactRole(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className={fieldClass}
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className={labelClass}>
                  Téléphone
                </label>
                <input
                  id="contact-phone"
                  className={fieldClass}
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="contact-primary"
                  type="checkbox"
                  checked={contactPrimary}
                  onChange={(event) =>
                    setContactPrimary(event.target.checked)
                  }
                />
                <label htmlFor="contact-primary" className="text-sm text-ink">
                  Contact principal
                </label>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className={buttonPrimary}>
                  Ajouter le contact
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="font-display text-xl text-ink">
              Postes budgétaires liés
            </h4>
            {linkedItems.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Aucun poste budgétaire lié.
              </p>
            ) : (
              <ul className="space-y-1 text-sm text-ink-muted">
                {linkedItems.map((item) => (
                  <li key={item.id}>
                    {item.name} · engagé{" "}
                    {formatMoney(item.committedCents, workspace.currency)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
