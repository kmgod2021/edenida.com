import { expect, test, type Page } from "@playwright/test";

import {
  FIXTURE_PRIVATE_NOTE,
  FIXTURE_SLUG,
  FIXTURE_TOKENS,
  FIXTURE_WEDDING_ID,
} from "../src/features/guests/data/fixture-tokens";

function sessionId() {
  return `e2e${Math.random().toString(36).slice(2, 10)}`;
}

function guestList(session: string, scenario = "demo") {
  const params = new URLSearchParams({ session });
  if (scenario !== "demo") params.set("scenario", scenario);
  return `/app/weddings/${FIXTURE_WEDDING_ID}/guests?${params.toString()}`;
}

function pageAlert(page: Page) {
  return page.locator("main").getByRole("alert");
}

function dashboardCount(page: Page, label: string) {
  return page
    .locator("dl div")
    .filter({ has: page.locator("dt", { hasText: new RegExp(`^${label}$`) }) })
    .locator("dd");
}

test.describe("guest list", () => {
  test("searches and filters the fixture list", async ({ page }) => {
    const session = sessionId();
    await page.goto(guestList(session));
    await expect(page.getByRole("heading", { name: "Invités", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Léa Martin" })).toBeVisible();

    await page.getByLabel("Rechercher").fill("diallo");
    await expect(page.getByRole("link", { name: "Awa Diallo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Léa Martin" })).toHaveCount(0);

    await page.getByLabel("Rechercher").fill("");
    await page.getByLabel("Statut RSVP").selectOption("declined");
    await expect(page.getByRole("link", { name: "Samir Diallo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Léa Martin" })).toHaveCount(0);

    await page.getByLabel("Statut RSVP").selectOption("all");
    await page.getByLabel("Côté").selectOption({ label: "Côté Julien" });
    await expect(page.getByRole("link", { name: "Awa Diallo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Léa Martin" })).toHaveCount(0);
  });

  test("edits meal and dietary restrictions", async ({ page }) => {
    const session = sessionId();
    await page.goto(guestList(session));
    await page.getByRole("link", { name: "Léa Martin" }).click();
    await expect(page.getByRole("heading", { name: "Léa Martin" })).toBeVisible();
    await page.getByLabel("Choix de repas").selectOption("vegetarian");
    await page.getByLabel("Sans gluten").check();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status")).toHaveText("Invité enregistré.");
    const row = page.getByRole("listitem").filter({ hasText: "Léa Martin" });
    await expect(row).toContainText("Végétarien");
    await expect(row).toContainText("Sans gluten");
  });

  test("creates a guest and removes them", async ({ page }) => {
    const session = sessionId();
    await page.goto(guestList(session));
    await page.getByRole("link", { name: "Ajouter un invité" }).click();
    await page.getByLabel("Prénom").fill("Nina");
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Bernard");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("link", { name: "Nina Bernard" })).toBeVisible();

    await page.getByRole("link", { name: "Nina Bernard" }).click();
    await page.getByRole("button", { name: "Retirer de la liste" }).click();
    await page.getByRole("button", { name: "Confirmer le retrait" }).click();
    await expect(page.getByRole("status")).toHaveText("Invité retiré de la liste.");
    await expect(page.getByRole("link", { name: "Nina Bernard" })).toHaveCount(0);
  });

  test("creates a household", async ({ page }) => {
    const session = sessionId();
    await page.goto(
      `/app/weddings/${FIXTURE_WEDDING_ID}/households?session=${session}`,
    );
    await page.getByLabel("Nom du foyer").fill("Famille Bernard");
    await page.locator("#household-address").fill("8 rue Verte, Nantes");
    await page.getByRole("button", { name: "Ajouter le foyer" }).click();
    await expect(page.getByRole("status")).toHaveText("Foyer enregistré.");
    await expect(page.getByRole("heading", { name: "Famille Bernard" })).toBeVisible();
    await expect(page.getByText("Aucune personne dans ce foyer.")).toBeVisible();
  });

  test("shows an empty list and an error that hides guest names", async ({ page }) => {
    const session = sessionId();
    await page.goto(guestList(session, "empty"));
    await expect(
      page.getByRole("heading", { name: "Aucun invité pour l'instant" }),
    ).toBeVisible();
    await expect(page.getByText("Léa Martin")).toHaveCount(0);

    await page.goto(guestList(session, "error"));
    await expect(pageAlert(page)).toContainText("indisponibles");
    await expect(page.getByText("Léa Martin")).toHaveCount(0);
    await expect(page.getByText(FIXTURE_PRIVATE_NOTE)).toHaveCount(0);
  });
});

test.describe("RSVP", () => {
  test("shows dashboard counts", async ({ page }) => {
    const session = sessionId();
    await page.goto(`/app/weddings/${FIXTURE_WEDDING_ID}/rsvp?session=${session}`);
    await expect(page.getByRole("heading", { name: "Réponses", exact: true })).toBeVisible();
    await expect(dashboardCount(page, "Présents")).toHaveText("3");
    await expect(page.getByRole("link", { name: "Awa Diallo" })).toBeVisible();
  });

  test("submits a public RSVP and updates the couple dashboard", async ({ page }) => {
    const session = sessionId();
    const params = new URLSearchParams({ t: FIXTURE_TOKENS.lea, session });
    await page.goto(`/w/${FIXTURE_SLUG}/rsvp?${params.toString()}`);
    await expect(page.getByRole("heading", { name: "Bonjour Léa" })).toBeVisible();
    for (const hidden of ["Awa Diallo", "Marc Martin", "Samir Diallo", FIXTURE_PRIVATE_NOTE]) {
      await expect(page.getByText(hidden)).toHaveCount(0);
    }

    await page.getByRole("radio", { name: "Je serai là" }).check();
    await page.getByRole("checkbox", { name: /Cérémonie/ }).check();
    await page.getByRole("checkbox", { name: /Dîner/ }).check();
    await page.getByLabel("Nom de l'accompagnant").fill("Alex Martin");
    await page.getByRole("checkbox", { name: "Mon accompagnant sera là" }).check();
    await page.getByLabel("Choix de repas").selectOption("fish");
    await page.getByLabel("Sans gluten").check();
    await page.getByLabel("Allergies").fill("pollen");
    await page.getByRole("button", { name: "Envoyer ma réponse" }).click();

    await expect(page.getByRole("heading", { name: "Merci, Léa" })).toBeVisible();
    await expect(page.getByText("Poisson")).toBeVisible();
    await expect(page.getByText("Sans gluten")).toBeVisible();
    await expect(page.getByText("Alex Martin")).toBeVisible();
    await expect(page.getByText("Awa")).toHaveCount(0);
    await expect(page.getByText(FIXTURE_TOKENS.lea)).toHaveCount(0);

    await page.goto(`/app/weddings/${FIXTURE_WEDDING_ID}/rsvp?session=${session}`);
    await expect(dashboardCount(page, "Présents")).toHaveText("4");
    await expect(dashboardCount(page, "Plus-ones présents")).toHaveText("1");
  });

  test("hides plus-one fields when the invitation does not allow one", async ({ page }) => {
    const session = sessionId();
    const params = new URLSearchParams({ t: FIXTURE_TOKENS.marc, session });
    await page.goto(`/w/${FIXTURE_SLUG}/rsvp?${params.toString()}`);
    await expect(page.getByRole("heading", { name: "Bonjour Marc" })).toBeVisible();
    await page.getByRole("radio", { name: "Je serai là" }).check();
    await expect(page.getByLabel("Nom de l'accompagnant")).toHaveCount(0);
    await expect(page.getByText("Awa")).toHaveCount(0);
  });

  test("shows one message for invalid, expired, revoked, and wrong-slug links", async ({ page }) => {
    const session = sessionId();
    async function open(path: string) {
      await page.goto(path);
      const alert = pageAlert(page);
      await expect(alert).toBeVisible();
      const text = (await alert.textContent()) ?? "";
      await expect(page.getByText("Léa")).toHaveCount(0);
      await expect(page.getByText("Awa")).toHaveCount(0);
      await expect(page.getByText(FIXTURE_PRIVATE_NOTE)).toHaveCount(0);
      return text;
    }

    const invalid = await open(
      `/w/${FIXTURE_SLUG}/rsvp?t=not-a-real-token&session=${session}`,
    );
    const expired = await open(
      `/w/${FIXTURE_SLUG}/rsvp?t=${FIXTURE_TOKENS.expired}&session=${session}`,
    );
    const revoked = await open(
      `/w/${FIXTURE_SLUG}/rsvp?t=${FIXTURE_TOKENS.revoked}&session=${session}`,
    );
    const wrongSlug = await open(
      `/w/autre-mariage/rsvp?t=${FIXTURE_TOKENS.lea}&session=${session}`,
    );
    expect(expired).toBe(invalid);
    expect(revoked).toBe(invalid);
    expect(wrongSlug).toBe(invalid);
  });
});
