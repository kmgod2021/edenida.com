import { expect, test } from "@playwright/test";

function planningPath(scenario: "seeded" | "empty" | "error"): string {
  const weddingId = `plan-${scenario}-${crypto.randomUUID()}`;
  const params = new URLSearchParams({
    scenario,
    today: "2026-09-21",
  });
  if (scenario !== "empty") params.set("date", "2027-06-19");
  return `/w/${weddingId}/planning?${params.toString()}`;
}

test.describe("planning workspace", () => {
  test("checklist, events, timeline, and local persistence", async ({ page }) => {
    const path = planningPath("seeded");
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: "Planning" })).toBeVisible();
    await expect(page.getByText("Date du mariage : 19 juin 2027")).toBeVisible();
    const progress = page.getByRole("progressbar", { name: "Progression de la checklist" });
    await expect(progress).toContainText("0 sur 8");

    await page.getByRole("radio", { name: "En retard" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Réserver le lieu" })).toBeVisible();
    await page.getByRole("radio", { name: "Toutes" }).click();
    await page.getByRole("checkbox", { name: "Marquer Réserver le lieu comme fait" }).check();
    await expect(page.getByRole("status")).toHaveText("Planning enregistré");
    await expect(progress).toContainText("1 sur 8");

    const addTask = page.getByRole("form", { name: "Ajouter une tâche" });
    await addTask.getByLabel("Titre de la tâche").fill("Envoyer le plan d'accès");
    await addTask.getByLabel("Échéance de la tâche").fill("2026-09-28");
    await addTask.getByLabel("Personne assignée").selectOption({ label: "Julien" });
    await addTask.getByRole("button", { name: "Ajouter la tâche" }).click();
    await page.getByRole("radio", { name: "À venir" }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: "Envoyer le plan d'accès" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Événements" }).click();
    const events = page.getByRole("tabpanel", { name: "Événements" });
    await expect(events.getByRole("heading", { level: 3, name: "Cérémonie" })).toBeVisible();
    await expect(events.getByRole("heading", { name: "Préparation" })).toBeVisible();
    await expect(events.getByRole("heading", { level: 3, name: "Dégustation du gâteau" })).toBeVisible();

    const addEvent = page.getByRole("form", { name: "Ajouter un événement" });
    await addEvent.getByLabel("Titre de l'événement").fill("Essayage final");
    await addEvent.getByLabel("Type d'événement").selectOption("planning");
    await addEvent.getByLabel("Date de l'événement").fill("2027-05-01");
    await addEvent.getByLabel("Lieu de l'événement").fill("Atelier");
    await addEvent.getByRole("button", { name: "Ajouter l'événement" }).click();
    await expect(events.getByRole("heading", { level: 3, name: "Essayage final" })).toBeVisible();

    await page.getByRole("tab", { name: "Jour J" }).click();
    const timeline = page.getByRole("tabpanel", { name: "Jour J" });
    await expect(timeline.getByRole("heading", { level: 3, name: "Ouverture du bal" })).toBeVisible();
    await expect(timeline.getByText("Première danse.")).toBeVisible();
    await expect(timeline.getByText("Chapelle du domaine")).toBeVisible();

    const addMoment = page.getByRole("form", { name: "Ajouter un moment" });
    await addMoment.getByLabel("Heure du moment").fill("14:15");
    await addMoment.getByLabel("Activité").fill("Arrivée des mariés");
    await addMoment.getByLabel("Lieu du moment").fill("Parvis");
    await addMoment.getByLabel("Personne responsable").selectOption({ label: "Camille" });
    await addMoment.getByLabel("Notes du moment").fill("Prévoir dix minutes de battement.");
    await addMoment.getByRole("button", { name: "Ajouter le moment" }).click();
    await expect(timeline.getByRole("heading", { level: 3, name: "Arrivée des mariés" })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);

    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Marquer Réserver le lieu comme fait" })).toBeChecked();
    await page.getByRole("radio", { name: "À venir" }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: "Envoyer le plan d'accès" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Événements" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Essayage final" })).toBeVisible();
    await page.getByRole("tab", { name: "Jour J" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Arrivée des mariés" })).toBeVisible();
    await expect(page.getByText("Prévoir dix minutes de battement.")).toBeVisible();
  });

  test("empty planning explains the next action", async ({ page }) => {
    await page.goto(planningPath("empty"));
    await expect(page.getByText("Aucune tâche pour l'instant.")).toBeVisible();
    await expect(page.getByText("La date du mariage n'est pas encore fixée.")).toBeVisible();

    await page.getByRole("tab", { name: "Événements" }).click();
    await expect(page.getByText("Aucun événement pour l'instant.")).toBeVisible();

    await page.getByRole("tab", { name: "Jour J" }).click();
    await expect(page.getByText("Le déroulé du jour J est vide.")).toBeVisible();
  });

  test("error state can retry into the checklist", async ({ page }) => {
    await page.goto(planningPath("error"));
    await expect(
      page.getByRole("alert").filter({ hasText: "Nous n'avons pas pu charger le planning." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(page.getByRole("progressbar", { name: "Progression de la checklist" })).toContainText(
      "0 sur 8",
    );
  });
});
