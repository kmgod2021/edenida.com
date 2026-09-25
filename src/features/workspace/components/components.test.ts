import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => {
  return {
    default: ({
      href,
      children,
      ...props
    }: {
      href: string;
      children?: ReactNode;
    }) => createElement("a", { href, ...props }, children),
  };
});

import { createExampleWorkspaceState } from "../data/fixtures";
import { createMemoryWeddingRepository } from "../data/memory-repository";
import {
  EXAMPLE_WEDDING_ID,
  FIXTURE_VIEWER_USER_ID,
} from "../data/state";
import type { WeddingContext } from "../domain/types";
import { DashboardView } from "./dashboard-view";
import { ModuleEmptyState } from "./module-empty-state";
import { OnboardingPanel } from "./onboarding-panel";
import { ProgressSummary } from "./progress-summary";
import { WeddingCountdown } from "./wedding-countdown";
import { WeddingDetailsFields } from "./wedding-details-fields";
import { WeddingPicker } from "./wedding-picker";
import { WeddingProvider, useWeddingContext } from "./wedding-provider";
import { WorkspaceErrorState } from "./workspace-error-state";
import { WorkspaceLoadingState } from "./workspace-loading-state";
import { WorkspaceNavList } from "./workspace-nav-list";
import { WorkspaceNotFound } from "./workspace-not-found";
import { WorkspaceShell } from "./workspace-shell";
import { workspaceNavItems } from "../domain/nav";

function html(node: ReactNode): string {
  return renderToStaticMarkup(createElement("div", null, node));
}

function Consumer() {
  const context = useWeddingContext();
  return createElement("p", null, context.current.wedding.title);
}

describe("workspace components", () => {
  it("renders onboarding with one primary action and the example fixture", () => {
    const markup = html(
      createElement(OnboardingPanel, { loadExampleAction: () => undefined }),
    );
    expect(markup).toContain("Votre mariage commence ici");
    expect(markup).toContain('href="/app/weddings/new"');
    expect(markup).toContain("Explorer un exemple");
  });

  it("labels the create-wedding fields", () => {
    const markup = html(createElement(WeddingDetailsFields));
    expect(markup).toContain("Titre du mariage");
    expect(markup).toContain("Nom du partenaire");
    expect(markup).toContain("ne crée pas de membre");
    expect(markup).toContain('type="date"');
  });

  it("renders countdown, empty progress, loading, error, and not-found states", () => {
    expect(html(createElement(WeddingCountdown, {
      daysUntil: null,
      settingsHref: "/app/weddings/x/settings",
    }))).toContain("Date à choisir");
    expect(html(createElement(WeddingCountdown, {
      daysUntil: 12,
      settingsHref: "/app/weddings/x/settings",
    }))).toContain(">12<");

    const progress = html(createElement(ProgressSummary, {
      percent: 20,
      steps: [
        { id: "date", ratio: 1 },
        { id: "website", ratio: 0 },
        { id: "guests", ratio: 0 },
        { id: "checklist", ratio: 0 },
        { id: "budget", ratio: 0 },
      ],
    }));
    expect(progress).toContain('aria-valuenow="20"');
    expect(progress).toContain("en place");
    expect(progress).toContain("à faire");

    expect(html(createElement(WorkspaceLoadingState))).toContain(
      "Chargement de l&#x27;espace mariage",
    );
    expect(html(createElement(WorkspaceErrorState, { onRetry: () => undefined }))).toContain(
      "Réessayer",
    );
    expect(html(createElement(WorkspaceNotFound))).toContain("introuvable");
    expect(html(createElement(ModuleEmptyState, {
      title: "Invités",
      description: "Aucun invité pour le moment.",
      actionHref: "/app/weddings/x",
      actionLabel: "Retour au tableau de bord",
    }))).toContain("Retour au tableau de bord");
  });

  it("marks the current nav item and keeps the shell landmark", () => {
    const weddingId = EXAMPLE_WEDDING_ID;
    const items = workspaceNavItems(weddingId);
    const markup = html(createElement(WorkspaceNavList, {
      items,
      pathname: `/app/weddings/${weddingId}`,
    }));
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("Tableau de bord");
    expect(markup).not.toContain("Plan de table");

    /* eslint-disable react/no-children-prop -- createElement props typing requires children */
    const shell = html(
      createElement(WorkspaceShell, {
        weddingTitle: "Camille & Julien",
        nav: createElement("p", null, "Nav"),
        children: createElement("p", null, "Contenu"),
      }),
    );
    /* eslint-enable react/no-children-prop */
    expect(shell).toContain('id="workspace-main"');
    expect(shell).toContain("Aller au contenu");
  });

  it("reads the wedding from context on the dashboard", async () => {
    const now = new Date("2026-09-21T15:00:00.000Z");
    const repo = createMemoryWeddingRepository(createExampleWorkspaceState(now), {
      now: () => now,
    });
    const current = await repo.getCurrent(FIXTURE_VIEWER_USER_ID, EXAMPLE_WEDDING_ID);
    const summary = await repo.getSummary(FIXTURE_VIEWER_USER_ID, EXAMPLE_WEDDING_ID);
    if (!current || !summary) throw new Error("example fixture missing");
    const value: WeddingContext = {
      viewerUserId: FIXTURE_VIEWER_USER_ID,
      current,
      summary,
    };
    /* eslint-disable react/no-children-prop -- createElement props typing requires children */
    const markup = html(
      createElement(WeddingProvider, {
        value,
        children: createElement(DashboardView),
      }),
    );
    /* eslint-enable react/no-children-prop */
    expect(markup).toContain("Camille &amp; Julien");
    expect(markup).toContain("Organisateur");
    expect(markup).toContain("pas encore membre");
    expect(markup).not.toContain(">Partenaire<");
    expect(markup).toContain("5 réponses sur 12 invités");
    expect(markup).toContain('aria-valuenow="66"');
    expect(markup).toContain(`/app/weddings/${EXAMPLE_WEDDING_ID}/planning`);
    expect(markup).not.toContain("/app/w/");
    expect(markup).not.toContain("/checklist");

    expect(() => html(createElement(Consumer))).toThrow(/WeddingProvider/);
    /* eslint-disable react/no-children-prop -- createElement props typing requires children */
    expect(
      html(
        createElement(WeddingProvider, {
          value,
          children: createElement(Consumer),
        }),
      ),
    ).toContain("Camille &amp; Julien");
    /* eslint-enable react/no-children-prop */
  });

  it("lists more than one wedding without dropping titles", () => {
    const markup = html(createElement(WeddingPicker, {
      weddings: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Premier",
          weddingDate: "2027-06-12",
          timezone: "America/Toronto",
          currency: "CAD",
          createdBy: FIXTURE_VIEWER_USER_ID,
          createdAt: "2026-09-21T15:00:00.000Z",
          updatedAt: "2026-09-21T15:00:00.000Z",
        },
        {
          id: "55555555-5555-4555-8555-555555555555",
          title: "Second",
          weddingDate: null,
          timezone: "America/Toronto",
          currency: "CAD",
          createdBy: FIXTURE_VIEWER_USER_ID,
          createdAt: "2026-09-21T15:00:00.000Z",
          updatedAt: "2026-09-21T15:00:00.000Z",
        },
      ],
    }));
    expect(markup).toContain("Premier");
    expect(markup).toContain("Second");
    expect(markup).toContain("Date à choisir");
  });
});
