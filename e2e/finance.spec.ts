import { test, expect } from "@playwright/test";

test.describe("finance budget + vendors", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("budget flow: total, category, item, payment, remaining", async ({
    page,
  }) => {
    await page.goto("/app/finance");
    await expect(
      page.getByRole("heading", { name: /Budget & prestataires/i }),
    ).toBeVisible();
    await expect(page.getByText(/Chargement du budget/i)).toHaveCount(0);

    await page.getByLabel(/Budget total/i).fill("10000");
    await page.getByRole("button", { name: /Enregistrer le budget/i }).click();
    await expect(page.getByText("10 000,00 CAD").first()).toBeVisible();

    await page.getByLabel(/Nom de la catégorie/i).fill("Photo");
    await page.getByRole("button", { name: /Ajouter la catégorie/i }).click();
    await expect(page.getByText("Photo").first()).toBeVisible();

    await page.getByLabel(/^Catégorie$/i).selectOption({ label: "Photo" });
    await page.getByLabel(/Nom du poste/i).fill("Forfait journée");
    await page.getByLabel(/^Estimé$/i).fill("3200");
    await page.getByLabel(/Engagé \(optionnel\)/i).fill("3200");
    await page.getByRole("button", { name: /Ajouter le poste/i }).click();
    await expect(page.getByText("Forfait journée")).toBeVisible();

    await page.getByLabel(/^Poste$/i).selectOption({ label: "Forfait journée" });
    await page.getByLabel(/Libellé/i).fill("Dépôt");
    await page.getByLabel(/^Montant$/i).fill("800");
    await page.getByRole("button", { name: /Ajouter le paiement/i }).click();
    await expect(page.getByText(/Dépôt/)).toBeVisible();

    await page.getByRole("button", { name: /Marquer payé/i }).click();
    await expect(page.getByText(/payé le/i)).toBeVisible();
    await expect(page.getByText("2 400,00 CAD").first()).toBeVisible();
  });

  test("vendor flow: photographer quote, deposit, balance, contact", async ({
    page,
  }) => {
    await page.goto("/app/finance");
    await expect(page.getByText(/Chargement du budget/i)).toHaveCount(0);

    await page.getByRole("tab", { name: /Prestataires/i }).click();
    await expect(
      page.getByRole("heading", { name: /Nouveau prestataire/i }),
    ).toBeVisible();

    await page.getByLabel(/^Nom$/i).fill("Atelier Lumière");
    await page.getByLabel(/^Catégorie$/i).selectOption("photographer");
    await page.getByLabel(/^Statut$/i).selectOption("quoted");
    await page.getByLabel(/^Devis$/i).fill("3200");
    await page.getByLabel(/^Dépôt$/i).fill("800");
    await page.getByLabel(/^Notes$/i).fill("Second photographe inclus.");
    await page.getByRole("button", { name: /Ajouter le prestataire/i }).click();

    await expect(page.getByText("Atelier Lumière").first()).toBeVisible();
    await expect(page.getByText(/3 200,00 CAD/)).toBeVisible();
    await expect(page.getByText(/2 400,00 CAD/)).toBeVisible();

    await page.getByLabel(/Nom du contact/i).fill("Léa Martin");
    await page.getByLabel(/^Rôle$/i).fill("Photographe principale");
    await page.getByLabel(/E-mail/i).fill("lea@atelier.ca");
    await page.getByLabel(/Téléphone/i).fill("514-555-0142");
    await page.getByRole("button", { name: /Ajouter le contact/i }).click();

    await expect(page.getByText("Léa Martin")).toBeVisible();
    await expect(page.getByText(/lea@atelier\.ca/)).toBeVisible();
  });

  test("empty states are calm and actionable", async ({ page }) => {
    await page.goto("/app/finance");
    await expect(page.getByText(/Chargement du budget/i)).toHaveCount(0);
    await expect(
      page.getByText(/Aucun poste pour l'instant/i),
    ).toBeVisible();

    await page.getByRole("tab", { name: /Prestataires/i }).click();
    await expect(
      page.getByText(/Aucun prestataire pour l'instant/i),
    ).toBeVisible();
  });
});
