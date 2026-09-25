import { test, expect } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const configured = Boolean(
  supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
/** Real signup needs confirmations OFF — local `supabase start` (see CI / config.toml). */
const localAuth =
  /127\.0\.0\.1|localhost/.test(supabaseUrl) ||
  process.env.E2E_AUTH_LOCAL === "1";

test.describe("auth pages (ui)", () => {
  test("login page validation errors", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("not-an-email");
    await page.getByLabel("Mot de passe").fill("x");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Adresse e-mail invalide/i)).toBeVisible();
  });
});

/**
 * Real Auth E2E via the Auth API (signup / login / logout).
 * No auth-schema SQL seeds, no mailbox, no privileged client key.
 */
test.describe("auth real supabase", () => {
  test.skip(!configured, "Supabase env not configured");
  test.skip(
    !localAuth,
    "Auth E2E requires local Supabase (enable_confirmations=false)",
  );

  test("signup → authenticated app → logout", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    const email = `edenida.signup.${id}@example.test`;
    const password = `TestPass!${id}aA1`;
    const fullName = `Signup ${id}`;

    await page.goto("/signup");
    await page.getByLabel("Nom").fill(fullName);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /Créer mon compte/i }).click();

    await expect(
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await expect(
      page.getByRole("heading", { name: /One wedding/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("login → persistence → logout → login again", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    const email = `edenida.login.${id}@example.test`;
    const password = `TestPass!${id}aA1`;
    const fullName = `Login ${id}`;

    await page.goto("/signup");
    await page.getByLabel("Nom").fill(fullName);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /Créer mon compte/i }).click();
    await expect(
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
    ).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: /Déconnexion/i }).click();
    await expect(
      page.getByRole("heading", { name: /One wedding/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /Se connecter/i }).click();

    await expect(
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(email)).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
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
      page.getByRole("heading", { name: "Votre mariage commence ici" }),
    ).toBeVisible({ timeout: 15000 });
  });
});
