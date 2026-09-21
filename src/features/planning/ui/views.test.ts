import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createEmptyPlanningSnapshot, createSeededPlanningSnapshot } from "../domain/template";
import { DEMO_MEMBERS } from "../fixtures/demo";
import { ChecklistView } from "./checklist-view";
import { EventsView } from "./events-view";
import { PlanningError, PlanningLoading } from "./states";
import { TimelineView } from "./timeline-view";

const ok = () => ({ ok: true as const });

function html(node: ReactElement): string {
  return renderToStaticMarkup(node)
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

describe("planning views", () => {
  const seeded = createSeededPlanningSnapshot({
    weddingId: "wedding_1",
    weddingDate: "2027-06-19",
    members: DEMO_MEMBERS,
  });

  it("shows checklist progress, categories, overdue, and upcoming", () => {
    const markup = html(
      createElement(ChecklistView, {
        categories: seeded.categories,
        tasks: seeded.tasks,
        members: seeded.members,
        today: "2027-06-10",
        onAddCategory: ok,
        onAddTask: ok,
        onPatchTask: () => undefined,
        onRemoveTask: () => undefined,
      }),
    );

    expect(markup).toContain("0 sur 8");
    expect(markup).toContain("Lieu");
    expect(markup).toContain("Réserver le lieu");
    expect(markup).toContain("Haute");
    expect(markup).toContain("Camille");
    expect(markup).toContain("En retard");
    expect(markup).toContain("À venir");
    expect(markup).toContain("Confirmer la capacité et la salle de repli.");
    expect(markup).toContain("aria-label=\"Progression de la checklist\"");
  });

  it("hides tasks outside the overdue filter", () => {
    const markup = html(
      createElement(ChecklistView, {
        categories: seeded.categories,
        tasks: seeded.tasks,
        members: seeded.members,
        today: "2027-06-10",
        initialFilter: "overdue",
        onAddCategory: ok,
        onAddTask: ok,
        onPatchTask: () => undefined,
        onRemoveTask: () => undefined,
      }),
    );

    expect(markup).toContain("Réserver le lieu");
    expect(markup).not.toContain("Relire le déroulé du jour J");
  });

  it("renders an empty checklist with the next action", () => {
    const empty = createEmptyPlanningSnapshot({
      weddingId: "wedding_1",
      weddingDate: null,
      members: DEMO_MEMBERS,
    });
    const markup = html(
      createElement(ChecklistView, {
        categories: empty.categories,
        tasks: empty.tasks,
        members: empty.members,
        today: "2026-09-21",
        onAddCategory: ok,
        onAddTask: ok,
        onPatchTask: () => undefined,
        onRemoveTask: () => undefined,
      }),
    );

    expect(markup).toContain("Aucune tâche pour l'instant.");
    expect(markup).toContain("Ajoutez une catégorie avant de créer une tâche.");
    expect(markup).toContain("0 sur 0");
  });

  it("splits wedding events from planning events", () => {
    const markup = html(
      createElement(EventsView, {
        events: seeded.events,
        onAddEvent: ok,
        onRemoveEvent: () => undefined,
      }),
    );

    expect(markup).toContain("Mariage");
    expect(markup).toContain("Préparation");
    expect(markup).toContain("Cérémonie");
    expect(markup).toContain("Dégustation du gâteau");
    expect(markup).toContain("Chapelle du domaine");
    expect(markup).toContain("Échange des vœux.");
  });

  it("renders an empty events state", () => {
    const markup = html(
      createElement(EventsView, {
        events: [],
        onAddEvent: ok,
        onRemoveEvent: () => undefined,
      }),
    );
    expect(markup).toContain("Aucun événement pour l'instant.");
  });

  it("shows day-of time, place, person, and notes", () => {
    const markup = html(
      createElement(TimelineView, {
        items: seeded.timeline,
        members: seeded.members,
        onAddItem: ok,
        onRemoveItem: () => undefined,
      }),
    );

    expect(markup).toContain("15:00");
    expect(markup).toContain("Cérémonie");
    expect(markup).toContain("Chapelle du domaine");
    expect(markup).toContain("Camille");
    expect(markup).toContain("Entrée, lectures, échange des vœux.");
    expect(markup).toContain("Non assigné");
  });

  it("renders an empty day-of timeline", () => {
    const markup = html(
      createElement(TimelineView, {
        items: [],
        members: DEMO_MEMBERS,
        onAddItem: ok,
        onRemoveItem: () => undefined,
      }),
    );
    expect(markup).toContain("Le déroulé du jour J est vide.");
  });

  it("renders loading and error states", () => {
    expect(html(createElement(PlanningLoading))).toContain("Chargement du planning…");
    expect(html(createElement(PlanningError, { error: "unavailable", onRetry: () => undefined }))).toContain(
      "Nous n'avons pas pu charger le planning.",
    );
    expect(html(createElement(PlanningError, { error: "invalid", onRetry: () => undefined }))).toContain(
      "illisibles",
    );
  });
});
