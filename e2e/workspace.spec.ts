import { expect, test } from "@playwright/test";

import {
  login,
  signUp,
  workspaceE2EConfigured,
  workspaceE2ELocal,
} from "./workspace-session";

test.describe("wedding workspace", () => {
  test.skip(!workspaceE2EConfigured, "Supabase env not configured");
  test.skip(
    !workspaceE2ELocal,
    "Workspace E2E requires local Supabase (enable_confirmations=false)",
  );

  test.beforeEach(async ({ page }) => {
    await signUp(page, "ui");
  });

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
    ).toHaveCount(0);
  });

  test("requires a title before creating a wedding", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(page.getByText("Le titre du mariage est requis")).toBeVisible();
  });

  test("creates a wedding and shows countdown, progress, and empty modules", async ({
    page,
  }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Camille & Julien");
    await page.getByLabel("Nom du partenaire").fill("Julien Morel");
    await page.getByLabel("Date du mariage").fill("2027-06-12");
    await page.getByRole("button", { name: "Créer le mariage" }).click();

    await expect(page).toHaveURL(/\/app\/weddings\/[0-9a-f-]{36}$/i);
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
    await expect(page.getByText(/Aucun partenaire indiqué/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Aucun invité/ })).toBeVisible();
    await expect(page.getByText("Enregistré sur votre compte.")).toBeVisible();

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "edenida_workspace")).toBe(
      false,
    );

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test("saves wedding settings", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Titre provisoire");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await page
      .getByRole("navigation", { name: "Espace mariage" })
      .getByRole("link", { name: "Réglages" })
      .click();
    await page.getByLabel("Titre du mariage").fill("Le mariage de Camille");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("Le mariage de Camille");
  });

  test("opens empty guest and planning modules", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Camille & Julien");
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(
      page.getByRole("heading", { name: "Camille & Julien" }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "Espace mariage" })
      .getByRole("link", { name: "Invités" })
      .click();
    await expect(page.getByRole("heading", { name: "Invités" })).toBeVisible();
    await expect(page.getByText(/Aucune donnée d'invité/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retour au tableau de bord" }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "Espace mariage" })
      .getByRole("link", { name: "Planning" })
      .click();
    await expect(page).toHaveURL(/\/app\/weddings\/[^/]+\/planning$/);
    await expect(page.getByRole("heading", { name: "Planning" })).toBeVisible();
    await expect(page.getByText(/n'est pas encore relié/)).toBeVisible();
  });

  test("shows a loading state while the new workspace opens", async ({ page }) => {
    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill("Camille & Julien");
    await page.route(/\/app\/weddings\/(?!new\b)[^/?#]+/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });
    await page.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(
      page.getByRole("status", { name: "Chargement de l'espace mariage" }),
    ).toBeVisible();
  });

  test("does not open an unknown wedding", async ({ page }) => {
    await page.goto("/app/weddings/00000000-0000-4000-8000-000000000099");
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

test.describe("wedding workspace persistence", () => {
  test.skip(!workspaceE2EConfigured, "Supabase env not configured");
  test.skip(
    !workspaceE2ELocal,
    "Workspace E2E requires local Supabase (enable_confirmations=false)",
  );

  test("keeps a wedding across reload, logout, and a new login", async ({
    page,
  }) => {
    const title = "Mariage persistant";
    const account = await signUp(page, "persist");

    await page.goto("/app/weddings/new");
    await page.getByLabel("Titre du mariage").fill(title);
    await page.getByLabel("Date du mariage").fill("2027-09-04");
    await page.getByRole("button", { name: "Créer le mariage" }).click();

    await expect(page).toHaveURL(/\/app\/weddings\/[0-9a-f-]{36}$/i);
    const weddingUrl = page.url();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Enregistré sur votre compte.")).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(weddingUrl);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(/septembre 2027/)).toBeVisible();

    await page.getByRole("button", { name: "Déconnexion" }).click();
    await expect(
      page.getByRole("heading", { name: /One wedding/i }),
    ).toBeVisible({ timeout: 15_000 });

    await login(page, account.email, account.password);
    await expect(page.getByRole("heading", { name: title })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(weddingUrl);

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "edenida_workspace")).toBe(
      false,
    );
  });

  test("hides another account's wedding and blocks anonymous access", async ({
    browser,
  }) => {
    const title = "Mariage privé";
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await signUp(ownerPage, "owner");
    await ownerPage.goto("/app/weddings/new");
    await ownerPage.getByLabel("Titre du mariage").fill(title);
    await ownerPage.getByRole("button", { name: "Créer le mariage" }).click();
    await expect(ownerPage).toHaveURL(/\/app\/weddings\/[0-9a-f-]{36}$/i);
    const weddingUrl = ownerPage.url();
    await expect(ownerPage.getByRole("heading", { name: title })).toBeVisible();

    const outsider = await browser.newContext();
    const outsiderPage = await outsider.newPage();
    await signUp(outsiderPage, "outsider");
    await outsiderPage.goto(weddingUrl);
    await expect(
      outsiderPage.getByRole("heading", { name: "Ce mariage est introuvable" }),
    ).toBeVisible();
    await expect(
      outsiderPage.getByRole("heading", { name: title }),
    ).toHaveCount(0);

    const anonymous = await browser.newContext();
    const anonymousPage = await anonymous.newPage();
    await anonymousPage.goto(weddingUrl);
    await expect(anonymousPage).toHaveURL(/\/login/);
    await expect(
      anonymousPage.getByRole("heading", { name: "Connexion" }),
    ).toBeVisible();
    await expect(anonymousPage.getByText(title)).toHaveCount(0);

    await owner.close();
    await outsider.close();
    await anonymous.close();
  });
});
