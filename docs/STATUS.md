# Edenida — Project Status

**Last update:** 2026-09-21
**Overall completion:** **38%**
Calculation: Phase 0 (5%×100%) + Phase 1 (5%×100%) + Phase 2 (12%×100%) + Phase 4 (20%×80%) = **38%**. Phases 3 and 5–11 = 0%.

Phase 4 is 8/10 slices (80%), not phase-complete. Slices done: domain model, block registry (11 types), six template presenters, builder workspace, enable/reorder, content editing, desktop/mobile preview, unit + Playwright. Not done: Supabase persistence, publish + public `/w/[slug]`. Acceptance for EDE-WEB-001: **READY_FOR_DATA_INTEGRATION**.

| Phase | Agent | Task | Status | Completion | Tests | PR | Blocker |
|---|---|---|---|---:|---|---|---|
| 0 Research & product | COORDINATOR | EDE-PLAN-001 | DONE | 100% | n/a (docs) | — | — |
| 1 Architecture | COORDINATOR | EDE-ARCH-001 | DONE | 100% | n/a (docs/ADR) | — | — |
| 2 Foundation | COORDINATOR | EDE-FOUND-002 | DONE (baseline frozen) | 100%* | unit 3/3; e2e smoke 3/3 | synced | Live Supabase keys |
| GitHub sync | DEVOPS-01 | EDE-GIT-001 | DONE | 100% (10/10) | CI success | https://github.com/kmgod2021/edenida.com | — |
| 3 Wedding workspace | — | — | NOT_STARTED | 0% | — | — | Needs Supabase project |
| 4 Website builder | EDENIDA-WEBSITE-01 | EDE-WEB-001 | READY_FOR_DATA_INTEGRATION | 80% (8/10) | unit 12/12; e2e builder 6/6 + smoke 6/6 | branch `agent/edenida-website-01/ede-web-001-builder-core` (not merged) | Persistence + publish |
| 5 Guests + RSVP | — | — | NOT_STARTED | 0% | — | — | — |
| 6 Checklist + events | — | — | NOT_STARTED | 0% | — | — | — |
| 7 Budget + vendors | — | — | NOT_STARTED | 0% | — | — | — |
| 8 Seating | — | — | NOT_STARTED | 0% | — | — | — |
| 9 Notes/files/inspiration | — | — | NOT_STARTED | 0% | — | — | — |
| 10 QA + security | — | — | NOT_STARTED | 0% | — | — | — |
| 11 Production readiness | — | — | NOT_STARTED | 0% | — | — | Vercel |

\*Phase 2 foundation frozen at `5135aaee8e7c89b6ec5ed872e34bef0a17b83b50`, then CI typegen fix `629f2e4e4ee911ac3503cb69d2b6e74bf8aff8fe`.
**EDE-GIT-001:** `main` synced to GitHub; CI green after `next typegen` step.

## Weighted model
See `docs/MVP.md` §5.

## Open blockers
1. **Supabase project + keys** → `.env.local` (blocks live signup/login and Phase 3 data)
2. **Vercel project** → preview/prod
3. Confirm default marketing locale (currently FR UI / EN tagline)

## Gate notes
- Remote: https://github.com/kmgod2021/edenida.com
- CI: https://github.com/kmgod2021/edenida.com/actions/runs/35537085908
- Foundation migration: `supabase/migrations/20260920010000_foundation.sql`
- EDE-WEB-001 handoff: `src/features/website/persistence/HANDOFF.md`
- Builder (Wave A, fixture): `/app/w/fixture-wedding/website`
