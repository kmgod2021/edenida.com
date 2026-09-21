"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  addBudgetItem,
  addCategory,
  addPayment,
  deleteBudgetItem,
  deleteCategory,
  deletePayment,
  markPaymentPaid,
  setTotalBudget,
  type CommandResult,
} from "../domain/commands";
import { formatMoney, parseMoneyInput } from "../domain/money";
import {
  isItemOverdue,
  isPaymentOverdue,
  itemMoney,
  rollupWorkspace,
} from "../domain/workspace";
import type { FinanceWorkspace } from "../domain/types";
import { MoneySummary } from "./money-summary";

type BudgetDashboardProps = {
  workspace: FinanceWorkspace;
  today: string;
  onWorkspaceChange: (result: CommandResult) => void;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";
const labelClass = "block text-sm text-ink";
const buttonPrimary =
  "inline-flex items-center justify-center rounded-md bg-ink px-3 py-2 text-sm font-medium text-bg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const buttonGhost =
  "inline-flex items-center justify-center rounded-md border border-line px-3 py-2 text-sm text-ink transition hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function BudgetDashboard({
  workspace,
  today,
  onWorkspaceChange,
}: BudgetDashboardProps) {
  const rollup = useMemo(() => rollupWorkspace(workspace), [workspace]);
  const sortedCategories = useMemo(
    () =>
      [...workspace.categories].sort((a, b) =>
        a.sortOrder === b.sortOrder
          ? a.name.localeCompare(b.name, "fr")
          : a.sortOrder - b.sortOrder,
      ),
    [workspace.categories],
  );

  const [totalBudgetInput, setTotalBudgetInput] = useState(
    String(workspace.totalBudgetCents / 100),
  );
  const [categoryName, setCategoryName] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemEstimated, setItemEstimated] = useState("");
  const [itemCommitted, setItemCommitted] = useState("");
  const [itemDueOn, setItemDueOn] = useState("");
  const [itemVendorId, setItemVendorId] = useState("");
  const [paymentItemId, setPaymentItemId] = useState("");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueOn, setPaymentDueOn] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const overdueItems = workspace.items.filter((item) =>
    isItemOverdue(item, workspace.payments, today),
  );
  const overduePayments = workspace.payments.filter((payment) =>
    isPaymentOverdue(payment, today),
  );

  function apply(result: CommandResult) {
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormError(null);
    onWorkspaceChange(result);
  }

  function handleSetTotalBudget(event: FormEvent) {
    event.preventDefault();
    const cents = parseMoneyInput(totalBudgetInput);
    if (cents === null) {
      setFormError("Budget total invalide.");
      return;
    }
    apply(setTotalBudget(workspace, cents));
  }

  function handleAddCategory(event: FormEvent) {
    event.preventDefault();
    const result = addCategory(workspace, { name: categoryName });
    apply(result);
    if (result.ok) {
      setCategoryName("");
      const created = result.workspace.categories.at(-1);
      if (created && !itemCategoryId) setItemCategoryId(created.id);
    }
  }

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    const estimated = parseMoneyInput(itemEstimated);
    if (estimated === null) {
      setFormError("Montant estimé invalide.");
      return;
    }
    const committedRaw = itemCommitted.trim();
    const committed = committedRaw
      ? parseMoneyInput(committedRaw)
      : estimated;
    if (committed === null) {
      setFormError("Montant engagé invalide.");
      return;
    }
    const result = addBudgetItem(workspace, {
      categoryId: itemCategoryId,
      name: itemName,
      estimatedCents: estimated,
      committedCents: committed,
      dueOn: itemDueOn || null,
      vendorId: itemVendorId || null,
    });
    apply(result);
    if (result.ok) {
      setItemName("");
      setItemEstimated("");
      setItemCommitted("");
      setItemDueOn("");
      setItemVendorId("");
      const created = result.workspace.items.at(-1);
      if (created && !paymentItemId) setPaymentItemId(created.id);
    }
  }

  function handleAddPayment(event: FormEvent) {
    event.preventDefault();
    const amount = parseMoneyInput(paymentAmount);
    if (amount === null) {
      setFormError("Montant de paiement invalide.");
      return;
    }
    const result = addPayment(workspace, {
      budgetItemId: paymentItemId,
      amountCents: amount,
      label: paymentLabel,
      dueOn: paymentDueOn || null,
    });
    apply(result);
    if (result.ok) {
      setPaymentLabel("");
      setPaymentAmount("");
      setPaymentDueOn("");
    }
  }

  return (
    <div className="space-y-8">
      <MoneySummary
        rollup={rollup}
        totalBudgetCents={workspace.totalBudgetCents}
        currency={workspace.currency}
      />

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <form
        onSubmit={handleSetTotalBudget}
        className="grid gap-3 rounded-md border border-line bg-bg-elevated/60 p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="total-budget" className={labelClass}>
            Budget total ({workspace.currency})
          </label>
          <input
            id="total-budget"
            name="totalBudget"
            className={fieldClass}
            value={totalBudgetInput}
            onChange={(event) => setTotalBudgetInput(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        <button type="submit" className={buttonPrimary}>
          Enregistrer le budget
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleAddCategory}
          className="space-y-3 rounded-md border border-line p-4"
        >
          <h3 className="font-display text-xl text-ink">Catégories</h3>
          <div>
            <label htmlFor="category-name" className={labelClass}>
              Nom de la catégorie
            </label>
            <input
              id="category-name"
              className={fieldClass}
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              required
            />
          </div>
          <button type="submit" className={buttonPrimary}>
            Ajouter la catégorie
          </button>
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aucune catégorie pour l&apos;instant.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sortedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2"
                >
                  <span>{category.name}</span>
                  <button
                    type="button"
                    className={buttonGhost}
                    onClick={() =>
                      apply(deleteCategory(workspace, category.id))
                    }
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <form
          onSubmit={handleAddItem}
          className="space-y-3 rounded-md border border-line p-4"
        >
          <h3 className="font-display text-xl text-ink">Nouveau poste</h3>
          <div>
            <label htmlFor="item-category" className={labelClass}>
              Catégorie
            </label>
            <select
              id="item-category"
              className={fieldClass}
              value={itemCategoryId}
              onChange={(event) => setItemCategoryId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="item-name" className={labelClass}>
              Nom du poste
            </label>
            <input
              id="item-name"
              className={fieldClass}
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="item-estimated" className={labelClass}>
                Estimé
              </label>
              <input
                id="item-estimated"
                className={fieldClass}
                value={itemEstimated}
                onChange={(event) => setItemEstimated(event.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div>
              <label htmlFor="item-committed" className={labelClass}>
                Engagé (optionnel)
              </label>
              <input
                id="item-committed"
                className={fieldClass}
                value={itemCommitted}
                onChange={(event) => setItemCommitted(event.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label htmlFor="item-due" className={labelClass}>
              Échéance
            </label>
            <input
              id="item-due"
              type="date"
              className={fieldClass}
              value={itemDueOn}
              onChange={(event) => setItemDueOn(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="item-vendor" className={labelClass}>
              Prestataire lié
            </label>
            <select
              id="item-vendor"
              className={fieldClass}
              value={itemVendorId}
              onChange={(event) => setItemVendorId(event.target.value)}
            >
              <option value="">Aucun</option>
              {workspace.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className={buttonPrimary}
            disabled={sortedCategories.length === 0}
          >
            Ajouter le poste
          </button>
        </form>
      </div>

      <section aria-label="Postes budgétaires" className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Postes</h3>
        {workspace.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-ink-muted">
            Aucun poste pour l&apos;instant. Ajoutez une catégorie, puis un
            poste.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-bg-elevated text-ink-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Poste
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Estimé
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Engagé
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Payé
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Restant
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Échéance
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {workspace.items.map((item) => {
                  const money = itemMoney(item, workspace.payments);
                  const category = workspace.categories.find(
                    (entry) => entry.id === item.categoryId,
                  );
                  const vendor = workspace.vendors.find(
                    (entry) => entry.id === item.vendorId,
                  );
                  return (
                    <tr key={item.id} className="border-t border-line">
                      <td className="px-3 py-2">
                        <div className="font-medium text-ink">{item.name}</div>
                        <div className="text-xs text-ink-muted">
                          {category?.name ?? "Sans catégorie"}
                          {vendor ? ` · ${vendor.name}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMoney(money.estimatedCents, workspace.currency)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMoney(money.committedCents, workspace.currency)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMoney(money.paidCents, workspace.currency)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMoney(money.remainingCents, workspace.currency)}
                      </td>
                      <td className="px-3 py-2">
                        {item.dueOn ?? "—"}
                        {isItemOverdue(item, workspace.payments, today) ? (
                          <span className="ml-2 text-xs text-danger">
                            En retard
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className={buttonGhost}
                          onClick={() =>
                            apply(deleteBudgetItem(workspace, item.id))
                          }
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form
        onSubmit={handleAddPayment}
        className="space-y-3 rounded-md border border-line p-4"
      >
        <h3 className="font-display text-xl text-ink">Paiement</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="payment-item" className={labelClass}>
              Poste
            </label>
            <select
              id="payment-item"
              className={fieldClass}
              value={paymentItemId}
              onChange={(event) => setPaymentItemId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {workspace.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="payment-label" className={labelClass}>
              Libellé
            </label>
            <input
              id="payment-label"
              className={fieldClass}
              value={paymentLabel}
              onChange={(event) => setPaymentLabel(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="payment-amount" className={labelClass}>
              Montant
            </label>
            <input
              id="payment-amount"
              className={fieldClass}
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <label htmlFor="payment-due" className={labelClass}>
              Échéance du paiement
            </label>
            <input
              id="payment-due"
              type="date"
              className={fieldClass}
              value={paymentDueOn}
              onChange={(event) => setPaymentDueOn(event.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className={buttonPrimary}
          disabled={workspace.items.length === 0}
        >
          Ajouter le paiement
        </button>
      </form>

      <section aria-label="Paiements" className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Paiements</h3>
        {workspace.payments.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun paiement enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {workspace.payments.map((payment) => {
              const item = workspace.items.find(
                (entry) => entry.id === payment.budgetItemId,
              );
              return (
                <li
                  key={payment.id}
                  className="flex flex-col gap-2 rounded-md border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {payment.label} ·{" "}
                      {formatMoney(payment.amountCents, workspace.currency)}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {item?.name ?? "Poste inconnu"}
                      {payment.dueOn ? ` · échéance ${payment.dueOn}` : ""}
                      {payment.paidOn
                        ? ` · payé le ${payment.paidOn}`
                        : " · non payé"}
                      {isPaymentOverdue(payment, today) ? (
                        <span className="text-danger"> · en retard</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!payment.paidOn ? (
                      <button
                        type="button"
                        className={buttonPrimary}
                        onClick={() =>
                          apply(markPaymentPaid(workspace, payment.id, today))
                        }
                      >
                        Marquer payé
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={buttonGhost}
                      onClick={() =>
                        apply(deletePayment(workspace, payment.id))
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Échéances" className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Échéances</h3>
        {overdueItems.length === 0 && overduePayments.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucune échéance en retard pour le moment.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {overdueItems.map((item) => (
              <li key={`item-${item.id}`} className="text-danger">
                Poste « {item.name} » — échéance {item.dueOn}
              </li>
            ))}
            {overduePayments.map((payment) => (
              <li key={`pay-${payment.id}`} className="text-danger">
                Paiement « {payment.label} » — échéance {payment.dueOn}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
