# Edenida — Project Status

**Last update:** 2026-09-20
**Overall completion:** **22%**
Calculation: Phase 0 (5%×100%) + Phase 1 (5%×100%) + Phase 2 (12%×100%) = **22%**. Phases 3–11 = 0%.

| Phase | Agent | Task | Status | Completion | Tests | PR | Blocker |
|---|---|---|---|---:|---|---|---|
| 0 Research & product | COORDINATOR | EDE-PLAN-001 | DONE | 100% | n/a (docs) | — | — |
| 1 Architecture | COORDINATOR | EDE-ARCH-001 | DONE | 100% | n/a (docs/ADR) | — | — |
| 2 Foundation | COORDINATOR | EDE-FOUND-001 → EDE-FOUND-002 | DONE (baseline frozen) | 100%* | unit 3/3; e2e smoke 3/3; gate revalidated | local commit | Live Supabase keys |
| 3 Wedding workspace | — | — | NOT_STARTED | 0% | — | — | Needs Supabase project |
| 4 Website builder | — | — | NOT_STARTED | 0% | — | — | — |
| 5 Guests + RSVP | — | — | NOT_STARTED | 0% | — | — | — |
| 6 Checklist + events | — | — | NOT_STARTED | 0% | — | — | — |
| 7 Budget + vendors | — | — | NOT_STARTED | 0% | — | — | — |
| 8 Seating | — | — | NOT_STARTED | 0% | — | — | — |
| 9 Notes/files/inspiration | — | — | NOT_STARTED | 0% | — | — | — |
| 10 QA + security | — | — | NOT_STARTED | 0% | — | — | — |
| 11 Production readiness | — | — | NOT_STARTED | 0% | — | — | GitHub/Vercel |

\*Phase 2 local foundation acceptance (10/10): Next 16.3.3 app, tokens+home, auth pages, Supabase SSR clients + proxy, migration+RLS skeleton, CI, lint/typecheck/build, unit+Playwright smoke.
**EDE-FOUND-002:** baseline locale figée par commit Git — aucun démarrage Phase 3. Live linked Supabase reste requis pour auth persistence E2E et Phase 3.

## Weighted model
See `docs/MVP.md` §5.

## Open blockers
1. **Supabase project + keys** → `.env.local` (blocks live signup/login and Phase 3 data)
2. **GitHub remote + Vercel project** → preview/prod
3. Confirm default marketing locale (currently FR UI / EN tagline)

## Gate notes (EDE-FOUND-002)
- `.env*` ignored; `.env.example` force-included
- No `.env.local` present at freeze time
- Foundation migration path: `supabase/migrations/20260920010000_foundation.sql`
