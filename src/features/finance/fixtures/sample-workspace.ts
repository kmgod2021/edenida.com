import type { FinanceWorkspace } from "../domain/types";

/**
 * Demo CAD wedding finance workspace for local UI / tests.
 * Totals (cents):
 * - totalBudget 4_000_000 ($40,000)
 * - estimated 2_530_000
 * - committed 2_370_000
 * - paid 380_000
 * - remaining to pay 1_990_000
 * - budget remaining 1_630_000
 */
export function createSampleWorkspace(
  weddingId = "wedding_demo_finance",
): FinanceWorkspace {
  return {
    schemaVersion: 1,
    weddingId,
    currency: "CAD",
    totalBudgetCents: 4_000_000,
    categories: [
      {
        id: "cat_venue",
        weddingId,
        name: "Lieu",
        sortOrder: 0,
        createdAt: "2026-01-10T12:00:00.000Z",
        updatedAt: "2026-01-10T12:00:00.000Z",
      },
      {
        id: "cat_photo",
        weddingId,
        name: "Photo & vidéo",
        sortOrder: 1,
        createdAt: "2026-01-10T12:00:00.000Z",
        updatedAt: "2026-01-10T12:00:00.000Z",
      },
      {
        id: "cat_food",
        weddingId,
        name: "Traiteur",
        sortOrder: 2,
        createdAt: "2026-01-10T12:00:00.000Z",
        updatedAt: "2026-01-10T12:00:00.000Z",
      },
    ],
    items: [
      {
        id: "item_venue",
        weddingId,
        categoryId: "cat_venue",
        vendorId: "vendor_domaine",
        name: "Location salle + terrain",
        estimatedCents: 1_200_000,
        committedCents: 1_150_000,
        dueOn: "2026-06-01",
        notes: "Contrat signé en janvier.",
        createdAt: "2026-01-12T12:00:00.000Z",
        updatedAt: "2026-01-12T12:00:00.000Z",
      },
      {
        id: "item_photo",
        weddingId,
        categoryId: "cat_photo",
        vendorId: "vendor_atelier",
        name: "Forfait photographe journée",
        estimatedCents: 350_000,
        committedCents: 320_000,
        dueOn: "2026-05-15",
        notes: "",
        createdAt: "2026-01-12T12:00:00.000Z",
        updatedAt: "2026-01-12T12:00:00.000Z",
      },
      {
        id: "item_catering",
        weddingId,
        categoryId: "cat_food",
        vendorId: null,
        name: "Menu assis 80 convives",
        estimatedCents: 980_000,
        committedCents: 900_000,
        dueOn: "2026-07-01",
        notes: "Devis en attente de confirmation.",
        createdAt: "2026-01-12T12:00:00.000Z",
        updatedAt: "2026-01-12T12:00:00.000Z",
      },
    ],
    payments: [
      {
        id: "pay_venue_deposit",
        weddingId,
        budgetItemId: "item_venue",
        amountCents: 300_000,
        dueOn: "2026-02-01",
        paidOn: "2026-01-28",
        label: "Dépôt lieu",
        notes: "",
        createdAt: "2026-01-15T12:00:00.000Z",
        updatedAt: "2026-01-28T12:00:00.000Z",
      },
      {
        id: "pay_photo_deposit",
        weddingId,
        budgetItemId: "item_photo",
        amountCents: 80_000,
        dueOn: "2026-03-01",
        paidOn: "2026-02-20",
        label: "Dépôt photo",
        notes: "",
        createdAt: "2026-01-15T12:00:00.000Z",
        updatedAt: "2026-02-20T12:00:00.000Z",
      },
      {
        id: "pay_venue_balance",
        weddingId,
        budgetItemId: "item_venue",
        amountCents: 850_000,
        dueOn: "2026-06-01",
        paidOn: null,
        label: "Solde lieu",
        notes: "",
        createdAt: "2026-01-15T12:00:00.000Z",
        updatedAt: "2026-01-15T12:00:00.000Z",
      },
    ],
    vendors: [
      {
        id: "vendor_domaine",
        weddingId,
        name: "Domaine des Érables",
        category: "venue",
        status: "booked",
        quoteCents: 1_150_000,
        depositCents: 300_000,
        notes: "Accès terrain dès 14 h.",
        website: "https://exemple.domaine-erables.test",
        createdAt: "2026-01-08T12:00:00.000Z",
        updatedAt: "2026-01-20T12:00:00.000Z",
      },
      {
        id: "vendor_atelier",
        weddingId,
        name: "Atelier Lumière",
        category: "photographer",
        status: "booked",
        quoteCents: 320_000,
        depositCents: 80_000,
        notes: "Second photographe inclus.",
        website: "",
        createdAt: "2026-01-09T12:00:00.000Z",
        updatedAt: "2026-01-22T12:00:00.000Z",
      },
    ],
    contacts: [
      {
        id: "contact_lea",
        weddingId,
        vendorId: "vendor_atelier",
        name: "Léa Martin",
        role: "Photographe principale",
        email: "lea@atelier.ca",
        phone: "514-555-0142",
        isPrimary: true,
        createdAt: "2026-01-09T12:00:00.000Z",
        updatedAt: "2026-01-09T12:00:00.000Z",
      },
    ],
    updatedAt: "2026-02-20T12:00:00.000Z",
  };
}
