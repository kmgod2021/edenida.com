import { expect, test, type Page } from "@playwright/test";

async function openPanel(page: Page, name: "Éditer" | "Aperçu") {
  const tab = page.getByRole("tab", { name });
  if (await tab.isVisible()) {
    await tab.click();
  }
}

test.describe("website builder", () => {
  test("edits copy, switches template without losing it, and previews desktop and mobile", async ({
    page,
  }) => {
    await page.goto("/app/w/fixture-wedding/website");

    await expect(page.getByRole("heading", { level: 1, name: "Site web" })).toBeVisible();
    await expect(page.getByText("Brouillon local")).toBeVisible();

    const title = page.getByLabel("Titre", { exact: true });
    await title.fill("Claire et Julien");

    await openPanel(page, "Aperçu");
    const preview = page.getByRole("region", { name: "Aperçu du site" });
    await expect(preview.getByRole("heading", { level: 1, name: "Claire et Julien" })).toBeVisible();
    await expect(preview.getByRole("heading", { name: "Notre histoire" })).toBeVisible();
    await expect(preview.getByText("Claire et Julien se sont rencontrés")).toBeVisible();

    await openPanel(page, "Éditer");
    await page.getByRole("radio", { name: /Luxe/ }).check();
    await expect(page.getByRole("status")).toContainText("contenu des sections est inchangé");

    await openPanel(page, "Aperçu");
    await expect(preview).toHaveAttribute("data-viewport", "desktop");
    await expect(preview.locator("[data-template='luxury']")).toBeVisible();
    await expect(preview.getByRole("heading", { level: 1, name: "Claire et Julien" })).toBeVisible();
    await expect(preview.getByText("Claire et Julien se sont rencontrés")).toBeVisible();

    await page.getByRole("radio", { name: "Mobile" }).check();
    await expect(preview).toHaveAttribute("data-viewport", "mobile");

    await openPanel(page, "Éditer");
    await page.getByRole("checkbox", { name: "Afficher Questions" }).uncheck();
    await openPanel(page, "Aperçu");
    await expect(preview.getByRole("heading", { name: "Questions" })).toHaveCount(0);

    await openPanel(page, "Éditer");
    await page.getByRole("button", { name: "Descendre Compte à rebours" }).click();
    await openPanel(page, "Aperçu");
    const story = preview.getByRole("heading", { name: "Notre histoire" });
    const countdown = preview.getByRole("heading", { name: "Le compte à rebours" });
    const storyBox = await story.boundingBox();
    const countdownBox = await countdown.boundingBox();
    expect(storyBox).not.toBeNull();
    expect(countdownBox).not.toBeNull();
    expect(storyBox!.y).toBeLessThan(countdownBox!.y);
  });

  test("shows an empty preview when every section is hidden", async ({ page }) => {
    await page.goto("/app/w/fixture-wedding/website?fixture=empty");
    await openPanel(page, "Aperçu");
    const preview = page.getByRole("region", { name: "Aperçu du site" });
    await expect(preview.getByRole("heading", { name: "Aucune section visible" })).toBeVisible();
    await preview.getByRole("button", { name: "Afficher l'ouverture" }).click();
    await openPanel(page, "Aperçu");
    await expect(preview.getByRole("heading", { level: 1, name: "Votre mariage" })).toBeVisible();
  });

  test("shows a load error with a retry", async ({ page }) => {
    await page.goto("/app/w/fixture-wedding/website?fixture=error");
    await expect(page.getByRole("heading", { name: "Impossible de charger le site" })).toBeVisible();
    // Next.js also injects an empty route announcer with role="alert".
    // Alert does not name itself from its text, so filter by the message.
    const loadError = page.getByRole("alert").filter({ hasText: "pas pu charger" });
    await expect(loadError).toContainText("pas pu charger");
    await page.getByRole("link", { name: "Réessayer" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Site web" })).toBeVisible();
  });
});
