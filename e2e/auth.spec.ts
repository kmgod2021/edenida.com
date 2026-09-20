import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { createConfirmedUser } from "../scripts/dev-auth-helpers.mjs";

config({ path: ".env.local" });

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

test.describe("auth real supabase", () => {
  test.skip(!configured, "Supabase env not configured");

  test("login → app → persistence → logout → login again", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    const email = `edenida.e2e.${id}@mailinator.com`;
    const password = `TestPass!${id}aA1`;

    // Seed confirmed user via DB (dev helper) to avoid Auth email rate limits.
    await createConfirmedUser({
      email,
      password,
      fullName: `E2E ${id}`,
    });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /Se connecter/i }).click();

    await expect(
      page.getByRole("heading", { name: /Votre espace mariage/i }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(email)).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: /Votre espace mariage/i }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await expect(
      page.getByRole("heading", { name: /One wedding/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(
      page.getByRole("heading", { name: /Votre espace mariage/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("signup form is usable", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Nom")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Créer mon compte/i }),
    ).toBeVisible();
  });

  test("login page validation errors", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("not-an-email");
    await page.getByLabel("Mot de passe").fill("x");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Adresse e-mail invalide/i)).toBeVisible();
  });
});
