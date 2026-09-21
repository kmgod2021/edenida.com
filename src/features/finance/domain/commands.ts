import type {
  BudgetCategory,
  BudgetItem,
  CreateId,
  FinanceWorkspace,
  Payment,
  Vendor,
  VendorCategory,
  VendorContact,
  VendorStatus,
} from "./types";
import { createId as defaultCreateId, nowIso, touchWorkspace } from "./workspace";

export type CommandOk = { ok: true; workspace: FinanceWorkspace };
export type CommandErr = { ok: false; error: string };
export type CommandResult = CommandOk | CommandErr;

type CommandContext = {
  now?: Date;
  createId?: CreateId;
};

function ctx(input?: CommandContext): {
  now: Date;
  createId: CreateId;
} {
  return {
    now: input?.now ?? new Date(),
    createId: input?.createId ?? defaultCreateId,
  };
}

function fail(error: string): CommandErr {
  return { ok: false, error };
}

function ok(workspace: FinanceWorkspace, now: Date): CommandOk {
  return { ok: true, workspace: touchWorkspace(workspace, now) };
}

function requireNonNegativeCents(
  label: string,
  cents: number,
): string | null {
  if (!Number.isInteger(cents) || cents < 0) {
    return `${label} doit être un montant entier non négatif (cents).`;
  }
  return null;
}

export function setTotalBudget(
  workspace: FinanceWorkspace,
  totalBudgetCents: number,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  const invalid = requireNonNegativeCents("Le budget total", totalBudgetCents);
  if (invalid) return fail(invalid);
  return ok({ ...workspace, totalBudgetCents }, now);
}

export function addCategory(
  workspace: FinanceWorkspace,
  input: { name: string },
  options?: CommandContext,
): CommandResult {
  const { now, createId } = ctx(options);
  const name = input.name.trim();
  if (!name) return fail("Le nom de la catégorie est requis.");

  const maxSort = workspace.categories.reduce(
    (max, category) => Math.max(max, category.sortOrder),
    -1,
  );
  const stamp = nowIso(now);
  const category: BudgetCategory = {
    id: createId(),
    weddingId: workspace.weddingId,
    name,
    sortOrder: maxSort + 1,
    createdAt: stamp,
    updatedAt: stamp,
  };

  return ok(
    { ...workspace, categories: [...workspace.categories, category] },
    now,
  );
}

export function renameCategory(
  workspace: FinanceWorkspace,
  categoryId: string,
  name: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  const trimmed = name.trim();
  if (!trimmed) return fail("Le nom de la catégorie est requis.");

  const categories = workspace.categories.map((category) =>
    category.id === categoryId
      ? { ...category, name: trimmed, updatedAt: nowIso(now) }
      : category,
  );
  if (!categories.some((category) => category.id === categoryId)) {
    return fail("Catégorie introuvable.");
  }
  return ok({ ...workspace, categories }, now);
}

export function deleteCategory(
  workspace: FinanceWorkspace,
  categoryId: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.categories.some((category) => category.id === categoryId)) {
    return fail("Catégorie introuvable.");
  }
  if (workspace.items.some((item) => item.categoryId === categoryId)) {
    return fail(
      "Impossible de supprimer une catégorie qui contient encore des postes.",
    );
  }
  return ok(
    {
      ...workspace,
      categories: workspace.categories.filter(
        (category) => category.id !== categoryId,
      ),
    },
    now,
  );
}

export type AddBudgetItemInput = {
  categoryId: string;
  name: string;
  estimatedCents: number;
  committedCents?: number;
  vendorId?: string | null;
  dueOn?: string | null;
  notes?: string;
};

export function addBudgetItem(
  workspace: FinanceWorkspace,
  input: AddBudgetItemInput,
  options?: CommandContext,
): CommandResult {
  const { now, createId } = ctx(options);
  if (!workspace.categories.some((category) => category.id === input.categoryId)) {
    return fail("Catégorie introuvable.");
  }
  const name = input.name.trim();
  if (!name) return fail("Le nom du poste est requis.");

  const estimatedInvalid = requireNonNegativeCents(
    "Le montant estimé",
    input.estimatedCents,
  );
  if (estimatedInvalid) return fail(estimatedInvalid);

  const committedCents =
    input.committedCents === undefined
      ? input.estimatedCents
      : input.committedCents;
  const committedInvalid = requireNonNegativeCents(
    "Le montant engagé",
    committedCents,
  );
  if (committedInvalid) return fail(committedInvalid);

  if (input.vendorId) {
    if (!workspace.vendors.some((vendor) => vendor.id === input.vendorId)) {
      return fail("Prestataire introuvable.");
    }
  }

  const stamp = nowIso(now);
  const item: BudgetItem = {
    id: createId(),
    weddingId: workspace.weddingId,
    categoryId: input.categoryId,
    vendorId: input.vendorId ?? null,
    name,
    estimatedCents: input.estimatedCents,
    committedCents,
    dueOn: input.dueOn ?? null,
    notes: input.notes?.trim() ?? "",
    createdAt: stamp,
    updatedAt: stamp,
  };

  return ok({ ...workspace, items: [...workspace.items, item] }, now);
}

export type UpdateBudgetItemInput = {
  name?: string;
  estimatedCents?: number;
  committedCents?: number;
  vendorId?: string | null;
  dueOn?: string | null;
  notes?: string;
  categoryId?: string;
};

export function updateBudgetItem(
  workspace: FinanceWorkspace,
  itemId: string,
  input: UpdateBudgetItemInput,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  const existing = workspace.items.find((item) => item.id === itemId);
  if (!existing) return fail("Poste introuvable.");

  if (input.categoryId) {
    if (
      !workspace.categories.some((category) => category.id === input.categoryId)
    ) {
      return fail("Catégorie introuvable.");
    }
  }
  if (input.vendorId) {
    if (!workspace.vendors.some((vendor) => vendor.id === input.vendorId)) {
      return fail("Prestataire introuvable.");
    }
  }
  if (input.estimatedCents !== undefined) {
    const invalid = requireNonNegativeCents(
      "Le montant estimé",
      input.estimatedCents,
    );
    if (invalid) return fail(invalid);
  }
  if (input.committedCents !== undefined) {
    const invalid = requireNonNegativeCents(
      "Le montant engagé",
      input.committedCents,
    );
    if (invalid) return fail(invalid);
  }

  const items = workspace.items.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      name: input.name !== undefined ? input.name.trim() : item.name,
      estimatedCents: input.estimatedCents ?? item.estimatedCents,
      committedCents: input.committedCents ?? item.committedCents,
      vendorId:
        input.vendorId === undefined ? item.vendorId : input.vendorId,
      dueOn: input.dueOn === undefined ? item.dueOn : input.dueOn,
      notes: input.notes !== undefined ? input.notes.trim() : item.notes,
      categoryId: input.categoryId ?? item.categoryId,
      updatedAt: nowIso(now),
    };
  });

  return ok({ ...workspace, items }, now);
}

export function deleteBudgetItem(
  workspace: FinanceWorkspace,
  itemId: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.items.some((item) => item.id === itemId)) {
    return fail("Poste introuvable.");
  }
  return ok(
    {
      ...workspace,
      items: workspace.items.filter((item) => item.id !== itemId),
      payments: workspace.payments.filter(
        (payment) => payment.budgetItemId !== itemId,
      ),
    },
    now,
  );
}

export type AddPaymentInput = {
  budgetItemId: string;
  amountCents: number;
  label: string;
  dueOn?: string | null;
  paidOn?: string | null;
  notes?: string;
};

export function addPayment(
  workspace: FinanceWorkspace,
  input: AddPaymentInput,
  options?: CommandContext,
): CommandResult {
  const { now, createId } = ctx(options);
  if (!workspace.items.some((item) => item.id === input.budgetItemId)) {
    return fail("Poste introuvable.");
  }
  const label = input.label.trim();
  if (!label) return fail("Le libellé du paiement est requis.");
  const invalid = requireNonNegativeCents("Le montant", input.amountCents);
  if (invalid) return fail(invalid);

  const stamp = nowIso(now);
  const payment: Payment = {
    id: createId(),
    weddingId: workspace.weddingId,
    budgetItemId: input.budgetItemId,
    amountCents: input.amountCents,
    dueOn: input.dueOn ?? null,
    paidOn: input.paidOn ?? null,
    label,
    notes: input.notes?.trim() ?? "",
    createdAt: stamp,
    updatedAt: stamp,
  };

  return ok({ ...workspace, payments: [...workspace.payments, payment] }, now);
}

export function markPaymentPaid(
  workspace: FinanceWorkspace,
  paymentId: string,
  paidOn: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.payments.some((payment) => payment.id === paymentId)) {
    return fail("Paiement introuvable.");
  }
  const payments = workspace.payments.map((payment) =>
    payment.id === paymentId
      ? { ...payment, paidOn, updatedAt: nowIso(now) }
      : payment,
  );
  return ok({ ...workspace, payments }, now);
}

export function deletePayment(
  workspace: FinanceWorkspace,
  paymentId: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.payments.some((payment) => payment.id === paymentId)) {
    return fail("Paiement introuvable.");
  }
  return ok(
    {
      ...workspace,
      payments: workspace.payments.filter(
        (payment) => payment.id !== paymentId,
      ),
    },
    now,
  );
}

export type AddVendorInput = {
  name: string;
  category: VendorCategory;
  status?: VendorStatus;
  quoteCents?: number | null;
  depositCents?: number;
  notes?: string;
  website?: string;
};

export function addVendor(
  workspace: FinanceWorkspace,
  input: AddVendorInput,
  options?: CommandContext,
): CommandResult {
  const { now, createId } = ctx(options);
  const name = input.name.trim();
  if (!name) return fail("Le nom du prestataire est requis.");

  if (input.quoteCents !== undefined && input.quoteCents !== null) {
    const invalid = requireNonNegativeCents("Le devis", input.quoteCents);
    if (invalid) return fail(invalid);
  }
  const depositCents = input.depositCents ?? 0;
  const depositInvalid = requireNonNegativeCents("Le dépôt", depositCents);
  if (depositInvalid) return fail(depositInvalid);

  const stamp = nowIso(now);
  const vendor: Vendor = {
    id: createId(),
    weddingId: workspace.weddingId,
    name,
    category: input.category,
    status: input.status ?? "considering",
    quoteCents: input.quoteCents ?? null,
    depositCents,
    notes: input.notes?.trim() ?? "",
    website: input.website?.trim() ?? "",
    createdAt: stamp,
    updatedAt: stamp,
  };

  return ok({ ...workspace, vendors: [...workspace.vendors, vendor] }, now);
}

export type UpdateVendorInput = {
  name?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  quoteCents?: number | null;
  depositCents?: number;
  notes?: string;
  website?: string;
};

export function updateVendor(
  workspace: FinanceWorkspace,
  vendorId: string,
  input: UpdateVendorInput,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.vendors.some((vendor) => vendor.id === vendorId)) {
    return fail("Prestataire introuvable.");
  }
  if (input.quoteCents !== undefined && input.quoteCents !== null) {
    const invalid = requireNonNegativeCents("Le devis", input.quoteCents);
    if (invalid) return fail(invalid);
  }
  if (input.depositCents !== undefined) {
    const invalid = requireNonNegativeCents("Le dépôt", input.depositCents);
    if (invalid) return fail(invalid);
  }

  const vendors = workspace.vendors.map((vendor) => {
    if (vendor.id !== vendorId) return vendor;
    return {
      ...vendor,
      name: input.name !== undefined ? input.name.trim() : vendor.name,
      category: input.category ?? vendor.category,
      status: input.status ?? vendor.status,
      quoteCents:
        input.quoteCents === undefined ? vendor.quoteCents : input.quoteCents,
      depositCents: input.depositCents ?? vendor.depositCents,
      notes: input.notes !== undefined ? input.notes.trim() : vendor.notes,
      website:
        input.website !== undefined ? input.website.trim() : vendor.website,
      updatedAt: nowIso(now),
    };
  });

  return ok({ ...workspace, vendors }, now);
}

export function deleteVendor(
  workspace: FinanceWorkspace,
  vendorId: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.vendors.some((vendor) => vendor.id === vendorId)) {
    return fail("Prestataire introuvable.");
  }

  return ok(
    {
      ...workspace,
      vendors: workspace.vendors.filter((vendor) => vendor.id !== vendorId),
      contacts: workspace.contacts.filter(
        (contact) => contact.vendorId !== vendorId,
      ),
      items: workspace.items.map((item) =>
        item.vendorId === vendorId
          ? { ...item, vendorId: null, updatedAt: nowIso(now) }
          : item,
      ),
    },
    now,
  );
}

export type AddVendorContactInput = {
  vendorId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
};

export function addVendorContact(
  workspace: FinanceWorkspace,
  input: AddVendorContactInput,
  options?: CommandContext,
): CommandResult {
  const { now, createId } = ctx(options);
  if (!workspace.vendors.some((vendor) => vendor.id === input.vendorId)) {
    return fail("Prestataire introuvable.");
  }
  const name = input.name.trim();
  if (!name) return fail("Le nom du contact est requis.");

  const email = input.email?.trim() ?? "";
  if (email) {
    // Light check; full Zod validation happens on persistence boundaries.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("Adresse e-mail invalide.");
    }
  }

  const stamp = nowIso(now);
  const isPrimary = Boolean(input.isPrimary);
  let contacts = workspace.contacts;
  if (isPrimary) {
    contacts = contacts.map((contact) =>
      contact.vendorId === input.vendorId
        ? { ...contact, isPrimary: false, updatedAt: stamp }
        : contact,
    );
  }

  const contact: VendorContact = {
    id: createId(),
    weddingId: workspace.weddingId,
    vendorId: input.vendorId,
    name,
    role: input.role?.trim() ?? "",
    email,
    phone: input.phone?.trim() ?? "",
    isPrimary,
    createdAt: stamp,
    updatedAt: stamp,
  };

  return ok({ ...workspace, contacts: [...contacts, contact] }, now);
}

export function deleteVendorContact(
  workspace: FinanceWorkspace,
  contactId: string,
  options?: CommandContext,
): CommandResult {
  const { now } = ctx(options);
  if (!workspace.contacts.some((contact) => contact.id === contactId)) {
    return fail("Contact introuvable.");
  }
  return ok(
    {
      ...workspace,
      contacts: workspace.contacts.filter(
        (contact) => contact.id !== contactId,
      ),
    },
    now,
  );
}
