import { config } from "dotenv";
import { expect, type Page } from "@playwright/test";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const workspaceE2EConfigured = Boolean(
  supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const workspaceE2ELocal =
  /127\.0\.0\.1|localhost/.test(supabaseUrl) ||
  process.env.E2E_AUTH_LOCAL === "1";

export async function signUp(page: Page, label: string) {
  const id = crypto.randomUUID().slice(0, 8);
  const email = `edenida.ws.${label}.${id}@example.test`;
  const password = `TestPass!${id}aA1`;

  await page.goto("/signup");
  await page.getByLabel("Nom").fill(`Workspace ${label} ${id}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: /Créer mon compte/i }).click();
  await expect(
    page.getByRole("heading", { name: "Votre mariage commence ici" }),
  ).toBeVisible({ timeout: 20_000 });

  return { email, password };
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();
}
