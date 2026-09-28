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

  test("auth callback without a code shows a safe error", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(
      page.getByRole("heading", { name: /Lien de connexion invalide/i }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/error$/);
  });

  test("auth callback failed exchange shows a safe error", async ({ page }) => {
    await page.goto("/auth/callback?code=not-a-valid-code&next=/app");
    await expect(
      page.getByRole("heading", { name: /Lien de connexion invalide/i }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/error$/);
    await expect(page.getByText(/not-a-valid-code/)).toHaveCount(0);
  });

  test("auth callback does not follow an external next", async ({ page }) => {
    await page.goto(
      "/auth/callback?code=not-a-valid-code&next=https://evil.example/phish",
    );
    await expect(page).toHaveURL(/\/auth\/error$/);
    expect(page.url()).not.toContain("evil.example");
  });
});

test.describe("signup confirmation required", () => {
  test.skip(!configured, "Supabase env not configured");

  test("shows check your email and sets the callback redirect", async ({
    page,
  }) => {
    let redirectTo: string | null = null;

    await page.route("**/auth/v1/signup**", async (route) => {
      redirectTo = new URL(route.request().url()).searchParams.get(
        "redirect_to",
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          aud: "authenticated",
          role: "authenticated",
          email: "confirm@example.test",
          identities: [],
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }),
      });
    });

    await page.goto("/signup");
    await page.getByLabel("Nom").fill("Confirm Person");
    await page.getByLabel("E-mail").fill("confirm@example.test");
    await page.getByLabel("Mot de passe").fill("TestPass!confirm1");
    await page.getByRole("button", { name: /Créer mon compte/i }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(
      page.getByRole("heading", { name: /Votre espace mariage/i }),
    ).toHaveCount(0);

    expect(redirectTo).toBeTruthy();
    const callback = new URL(redirectTo ?? "");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/app");

    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
    const expectedOrigin = configuredSite
      ? new URL(configuredSite).origin
      : "http://localhost:3000";
    expect(callback.origin).toBe(expectedOrigin);
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
