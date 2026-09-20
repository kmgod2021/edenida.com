import { test, expect } from "@playwright/test";

test.describe("marketing home", () => {
  test("shows Edenida brand and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("banner").getByText("Edenida", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /One wedding\. One workspace\. Everything organized\./i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Créer mon espace mariage/i }),
    ).toBeVisible();
  });
});

test.describe("auth pages", () => {
  test("signup page is reachable", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /Créer un compte/i }),
    ).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Connexion/i }),
    ).toBeVisible();
  });
});
