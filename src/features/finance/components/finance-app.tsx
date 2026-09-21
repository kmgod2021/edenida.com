"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import type { CommandResult } from "../domain/commands";
import { DEMO_FINANCE_WEDDING_ID } from "../domain/labels";
import { createEmptyWorkspace, todayIso } from "../domain/workspace";
import { createSampleWorkspace } from "../fixtures/sample-workspace";
import { FinancePersistenceError } from "../persistence/errors";
import { LocalStorageFinanceRepository } from "../persistence/local-storage-repository";
import type { FinanceRepository } from "../persistence/port";
import type { FinanceWorkspace } from "../domain/types";
import { BudgetDashboard } from "./budget-dashboard";
import { VendorManager } from "./vendor-manager";

type TabId = "budget" | "vendors";

type FinanceAppProps = {
  weddingId?: string;
  repository?: FinanceRepository;
};

export function FinanceApp({
  weddingId = DEMO_FINANCE_WEDDING_ID,
  repository,
}: FinanceAppProps) {
  const repo = useMemo(
    () =>
      repository ??
      (typeof window !== "undefined"
        ? new LocalStorageFinanceRepository(window.localStorage)
        : null),
    [repository],
  );

  const [workspace, setWorkspace] = useState<FinanceWorkspace | null>(null);
  const [tab, setTab] = useState<TabId>("budget");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const today = todayIso();

  const persist = useCallback(
    async (next: FinanceWorkspace) => {
      if (!repo) return;
      try {
        await repo.save(next);
        setSaveError(null);
      } catch (error) {
        const message =
          error instanceof FinancePersistenceError
            ? error.message
            : "Impossible d'enregistrer localement.";
        setSaveError(message);
      }
    },
    [repo],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!repo) {
        setWorkspace(createEmptyWorkspace(weddingId));
        setLoadState("ready");
        return;
      }

      setLoadState("loading");
      try {
        const loaded = await repo.load(weddingId);
        if (cancelled) return;
        setWorkspace(loaded ?? createEmptyWorkspace(weddingId));
        setLoadState("ready");
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) return;
        setLoadState("error");
        setErrorMessage(
          error instanceof FinancePersistenceError
            ? error.message
            : "Chargement du budget impossible.",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [repo, weddingId]);

  function handleCommand(result: CommandResult) {
    if (!result.ok || !workspace) return;
    setWorkspace(result.workspace);
    void persist(result.workspace);
  }

  async function handleLoadSample() {
    const sample = createSampleWorkspace(weddingId);
    setWorkspace(sample);
    setLoadState("ready");
    setErrorMessage(null);
    await persist(sample);
  }

  async function handleReset() {
    const empty = createEmptyWorkspace(weddingId);
    setWorkspace(empty);
    setLoadState("ready");
    setErrorMessage(null);
    setSelectedTab("budget");
    if (repo?.clear) {
      try {
        await repo.clear(weddingId);
      } catch {
        // Fall through to save empty workspace.
      }
    }
    await persist(empty);
  }

  function setSelectedTab(next: TabId) {
    setTab(next);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    setSelectedTab(tab === "budget" ? "vendors" : "budget");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/app" className="text-sm text-ink-muted hover:text-ink">
            ← Espace
          </Link>
          <h1 className="mt-2 font-display text-4xl text-ink">
            Budget & prestataires
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Suivez les estimés, les engagements, les paiements et vos
            prestataires. Les montants restent sur cet appareil jusqu&apos;à la
            connexion de votre espace mariage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-bg-elevated"
            onClick={() => void handleLoadSample()}
          >
            Charger l&apos;exemple
          </button>
          <button
            type="button"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-bg-elevated"
            onClick={() => void handleReset()}
          >
            Réinitialiser l&apos;espace local
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Sections finance"
        className="mt-8 flex gap-2 border-b border-line"
        onKeyDown={onTabKeyDown}
      >
        <button
          type="button"
          role="tab"
          id="tab-budget"
          aria-controls="panel-budget"
          aria-selected={tab === "budget"}
          tabIndex={tab === "budget" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "budget"
              ? "border-accent text-ink"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setSelectedTab("budget")}
        >
          Budget
        </button>
        <button
          type="button"
          role="tab"
          id="tab-vendors"
          aria-controls="panel-vendors"
          aria-selected={tab === "vendors"}
          tabIndex={tab === "vendors" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "vendors"
              ? "border-accent text-ink"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setSelectedTab("vendors")}
        >
          Prestataires
        </button>
      </div>

      {saveError ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {saveError}
        </p>
      ) : null}

      {loadState === "loading" ? (
        <p className="mt-10 text-ink-muted" aria-live="polite">
          Chargement du budget…
        </p>
      ) : null}

      {loadState === "error" ? (
        <div
          role="alert"
          className="mt-10 rounded-md border border-danger/30 bg-bg-elevated px-4 py-6"
        >
          <p className="font-medium text-danger">
            {errorMessage ?? "Une erreur est survenue."}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Réinitialisez l&apos;espace local ou chargez l&apos;exemple pour
            continuer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-ink px-3 py-2 text-sm text-bg"
              onClick={() => void handleReset()}
            >
              Réinitialiser
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-3 py-2 text-sm"
              onClick={() => void handleLoadSample()}
            >
              Charger l&apos;exemple
            </button>
          </div>
        </div>
      ) : null}

      {loadState === "ready" && workspace ? (
        <>
          <div
            role="tabpanel"
            id="panel-budget"
            aria-labelledby="tab-budget"
            hidden={tab !== "budget"}
            className="mt-8"
          >
            {tab === "budget" ? (
              <BudgetDashboard
                workspace={workspace}
                today={today}
                onWorkspaceChange={handleCommand}
              />
            ) : null}
          </div>
          <div
            role="tabpanel"
            id="panel-vendors"
            aria-labelledby="tab-vendors"
            hidden={tab !== "vendors"}
            className="mt-8"
          >
            {tab === "vendors" ? (
              <VendorManager
                workspace={workspace}
                onWorkspaceChange={handleCommand}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
