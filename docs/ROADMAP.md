# Edenida — Roadmap

## Phase 0 — Research & product definition
Benchmark, MVP, journeys, risks, master plan.

## Phase 1 — Architecture & system design
Stack lock, ERD, security model, ADRs, agent defs.

## Phase 2 — Foundation
Repo, Next.js 16.3, Tailwind, shadcn, Supabase clients, auth pages, CI, design tokens, Playwright scaffold.

## Phase 3 — Wedding workspace
Create wedding, settings, members, dashboard shell.

## Phase 4 — Wedding Website Builder (P0)
Templates, sections, theme, preview, publish, public page.

## Phase 5 — Guest List + RSVP
CRUD guests, tokens, RSVP form, dashboard summaries.

## Phase 6 — Checklist + Events + Timeline
Seeded checklist, events, day-of timeline.

## Phase 7 — Budget + Vendors
Budget module + vendor CRM.

## Phase 8 — Seating Chart
Tables, DnD assignments, capacity warnings.

## Phase 9 — Notes + Files + Inspiration
Notes, private storage, inspiration items.

## Phase 10 — QA + Security + Hardening
Full E2E, RLS audit, abuse cases, a11y pass.

## Phase 11 — Production readiness
Env secrets, Vercel prod, monitoring basics, release report.

## Dependency graph (high level)

```
Phase0 → Phase1 → Phase2 → Phase3
                              ├→ Phase4 (website) ──────────────┐
                              ├→ Phase5 (guests/RSVP) ──────────┤ depends on 3
                              ├→ Phase6 (checklist/events) ─────┤
                              └→ Phase7 (budget/vendors) ───────┤
Phase4 + Phase5 → Phase8 (seating needs guests)                 │
Phase3 → Phase9                                                 │
All features → Phase10 → Phase11 ←──────────────────────────────┘
```

## Safe parallelization (after Phase 3 + shared contracts)

| Track | Agent | Scope |
|---|---|---|
| A | FEATURE-01 | Website builder (`website-builder/`, `public-site/`, site tables) |
| B | FEATURE-02 | Guests + RSVP (`guests/`, invitation RPC) |
| C | FEATURE-03 | Checklist + events (`tasks/`, `events/`) |
| D | FEATURE-04 | Budget + vendors |

**Do not parallelize:** migrations touching same tables, package.json, design tokens, root layout, auth middleware.

Use branches: `agent/<agent-id>/<task-id>-<slug>` + isolated worktrees/cloud when parallel.
