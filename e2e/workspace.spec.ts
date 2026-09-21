import { expect, test } from "@playwright/test";

test.describe("wedding workspace", () => {
  test("starts from an empty onboarding state", async ({ page }) => {
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Créer le mariage" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Explorer un exemple" }),
    ).toBeVisible();
  });

  test("requires a title before creating a wedding", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Le titre du mariage est requis",
    );
  });

  test("creates a wedding and shows countdown, progress, and empty modules", async ({
    page,
  }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Camille & Julien");
    await page.getByLabel("Nom du partenaire").fill("Julien Morel");
    await page.getByLabel("Date du mariage").fill("2027-06-12");
    await page.getByRole("button", { name: "Créer le mariage" }).click();

    await expect(
      page.getByRole("heading", { name: "Camille & Julien" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Compte à rebours" }),
    ).not.toContainText("Date à choisir");
    await expect(
      page.getByRole("meter", { name: "Avancement du mariage" }),
    ).toHaveAttribute("aria-valuenow", "20");
    await expect(page.getByRole("list", { name: "Membres" })).toContainText(
      "Organisateur",
    );
    await expect(
      page.getByText("Julien Morel — partenaire indiqué, pas encore membre."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Aucun invité/ })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test("saves wedding settings", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Titre provisoire");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await page.getByRole("link", { name: "Réglages" }).click();
    await page.getByLabel("Titre du mariage").fill("Le mariage de Camille");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Modifications enregistrées.",
    );
    await expect(page.getByRole("banner")).toContainText("Le mariage de Camille");
  });

  test("opens the example fixture and an empty guest module", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Explorer un exemple" }).click();
    await expect(
      page.getByRole("heading", { name: "Camille & Julien" }),
    ).toBeVisible();
    await expect(
      page.getByRole("meter", { name: "Avancement du mariage" }),
    ).toHaveAttribute("aria-valuenow", "66");
    await expect(page.getByText("5 réponses sur 12 invités")).toBeVisible();

    await page
      .getByRole("navigation", { name: "Espace mariage" })
      .getByRole("link", { name: "Invités" })
      .click();
    await expect(page.getByRole("heading", { name: "Invités" })).toBeVisible();
    await expect(page.getByText(/Aucune donnée d'invité/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retour au tableau de bord" }),
    ).toBeVisible();
  });

  test("shows a loading state while the new workspace opens", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Camille & Julien");
    await page.route("**/app/w/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(
      page.getByRole("status", { name: "Chargement de l'espace mariage" }),
    ).toBeVisible();
  });

  test("does not open an unknown wedding", async ({ page }) => {
    await page.goto("/app/w/00000000-0000-4000-8000-000000000099");
    await expect(
      page.getByRole("heading", { name: "Ce mariage est introuvable" }),
    ).toBeVisible();
  });

  test("lists two weddings from the workspace home", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Premier mariage");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await page.getByRole("link", { name: "Nouveau mariage" }).click();
    await page.getByLabel("Titre du mariage").fill("Second mariage");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await page.getByRole("link", { name: "Tous les mariages" }).click();
    await expect(page.getByRole("heading", { name: "Vos mariages" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Premier mariage/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Second mariage/ })).toBeVisible();
  });
});
