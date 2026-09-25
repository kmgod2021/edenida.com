# Edenida — Project Status

**Last update:** 2026-09-25
**Overall completion:** **22%** (Phase 3 still closed)
Calculation: Phase 0–2 complete (22%). Data foundation is merged at `13571dd` (PR #1). EDE-ARCH-001 route namespace lock is documentation only and does not add integrated capability or unlock Phase 3. Workspace Wave A on PR #3 is rebased and route-aligned, but it is not merged and stays fixture-backed, so it does not raise this percentage.

| Phase | Agent | Task | Status | Completion | Tests | PR | Blocker |
|---|---|---|---|---:|---|---|---|
| 0 Research & product | COORDINATOR | EDE-PLAN-001 | DONE | 100% | n/a | — | — |
| 1 Architecture | COORDINATOR | EDE-ARCH-001 | DONE | 100% | n/a | — | — |
| 2 Foundation | COORDINATOR | EDE-FOUND-002 | DONE | 100% | smoke | synced | — |
| GitHub sync | DEVOPS-01 | EDE-GIT-001 | DONE | 100% | CI green | synced | — |
| Supabase foundation | SUPABASE-01 | EDE-DATA-001 | MERGED | see baseline | pgTAP+auth e2e | #1 | — |
| Security harden R1 | SECURITY-01 | EDE-DATA-001-R1 | MERGED | see baseline | role matrix + local Auth E2E | #1 | — |
| Route namespace | ARCH-01 | EDE-ARCH-001 | LOCKED | n/a | docs only | [#8](https://github.com/kmgod2021/edenida.com/pull/8) merged | Baseline `d3c847f` |
| 3 Wedding workspace | WORKSPACE-01 | EDE-WORKSPACE-001-R1 | ROUTE_ALIGNED / READY_FOR_DATA_INTEGRATION | 0% | fixtures; not merged | [#3](https://github.com/kmgod2021/edenida.com/pull/3) draft | Wave B not started |

## Route namespace lock (ADR-005)

Authenticated management: `/app/weddings/[id]/…` (`id` = wedding UUID).
Public experience: `/w/[slug]/…` (`slug` = public identifier).

Deprecated before Wave A integration: `/app/w/[id]`, `/w/[slug]/planning` for internal planning, and `/app/finance`.

### Wave A integration route map

| Track | Current Wave A route | Locked route |
|---|---|---|
| Workspace | `/app/w/[weddingId]` | `/app/weddings/[id]` |
| Website editor | `/app/w/[weddingId]/website` | `/app/weddings/[id]/website` |
| Website public | `/w/[slug]` | `/w/[slug]` |
| Guests | `/app/weddings/[weddingId]/guests` | `/app/weddings/[id]/guests` |
| RSVP public | `/w/[slug]/rsvp` | `/w/[slug]/rsvp` |
| Planning | `/w/[slug]/planning` | `/app/weddings/[id]/planning` |
| Finance | `/app/finance` | `/app/weddings/[id]/budget` + `/vendors` |

Normative detail: `docs/adr/ADR-005-authenticated-public-route-namespace.md` and `docs/ARCHITECTURE.md` § Routing.

## EDE-DATA-001 / R1 notes
- DEVELOPMENT DB: foundation + RLS recursion fix + `20260921040000_harden_foundation_authorization`
- Helpers in `private.*` (SECURITY DEFINER, `search_path=''`); public helpers removed
- Wedding UPDATE via `private.can_edit_wedding` (viewer DENY); column grants exclude `id`/`created_by`/`created_at`
- Auth E2E: real signup/login/logout against **local** Supabase (`enable_confirmations=false`); no `auth.users` SQL seeds
- DB tests: official `supabase test db` (CI); no custom pgTAP parser

## Workspace Wave A (PR #3, not merged)

`EDE-WORKSPACE-001-R1` is rebased onto the Architecture Baseline and serves ADR-005 routes (`/app/weddings/[id]`, including `/planning`). Persistence is still the memory repository and the httpOnly cookie `edenida_workspace`. `EDE-WORKSPACE-002` is not started. This branch does not mark Phase 3 DONE and does not change overall integrated progress.

## Open blockers
1. PR [#3](https://github.com/kmgod2021/edenida.com/pull/3) stays draft until data integration. Do not merge from this task.
2. Vercel project (later)
