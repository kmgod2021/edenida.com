# Edenida — Project Status

**Last update:** 2026-09-26
**Overall completion:** **22%** (Phase 0–2). Phase 3 is integrated and is not rescored here.
Calculation: Phase 0–2 complete (22%). Data foundation is merged at `13571dd` (PR #1). Workspace persistence is merged at `207a521` (PR #3). The Auth email callback is not merged and does not change this percentage.

| Phase | Agent | Task | Status | Completion | Tests | PR | Blocker |
|---|---|---|---|---:|---|---|---|
| 0 Research & product | COORDINATOR | EDE-PLAN-001 | DONE | 100% | n/a | — | — |
| 1 Architecture | COORDINATOR | EDE-ARCH-001 | DONE | 100% | n/a | — | — |
| 2 Foundation | COORDINATOR | EDE-FOUND-002 | DONE | 100% | smoke | synced | — |
| GitHub sync | DEVOPS-01 | EDE-GIT-001 | DONE | 100% | CI green | synced | — |
| Supabase foundation | SUPABASE-01 | EDE-DATA-001 | MERGED | see baseline | pgTAP+auth e2e | #1 | — |
| Security harden R1 | SECURITY-01 | EDE-DATA-001-R1 | MERGED | see baseline | role matrix + local Auth E2E | #1 | — |
| Route namespace | ARCH-01 | EDE-ARCH-001 | LOCKED | n/a | docs only | [#8](https://github.com/kmgod2021/edenida.com/pull/8) merged | Baseline `d3c847f` |
| 3 Wedding workspace | WORKSPACE-02 | EDE-WORKSPACE-002 | MERGED | see baseline | persistence + pgTAP + e2e | [#3](https://github.com/kmgod2021/edenida.com/pull/3) | Baseline `207a521` |
| Auth email callback | AUTH-01 | EDE-AUTH-001 | IN_REVIEW | n/a | unit + auth e2e | [#10](https://github.com/kmgod2021/edenida.com/pull/10) | Cloud redirect allow list for `/auth/callback` |

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

## EDE-AUTH-001 notes
- `/auth/callback` exchanges the Supabase authorization code and redirects to a relative `next` (default `/app`)
- Signup `emailRedirectTo` uses the trusted public origin (`NEXT_PUBLIC_SITE_URL`, else `https://$VERCEL_URL`, else localhost in development)
- No session from `signUp` shows “Check your email”; a session still opens `/app` (local confirmations stay off)
- Does not change Phase 0–2 completion (overall remains 22%)

## EDE-DATA-001 / R1 notes
- DEVELOPMENT DB: foundation + RLS recursion fix + `20260921040000_harden_foundation_authorization`
- Helpers in `private.*` (SECURITY DEFINER, `search_path=''`); public helpers removed
- Wedding UPDATE via `private.can_edit_wedding` (viewer DENY); column grants exclude `id`/`created_by`/`created_at`
- Auth E2E: real signup/login/logout against **local** Supabase (`enable_confirmations=false`); no `auth.users` SQL seeds
- DB tests: official `supabase test db` (CI); no custom pgTAP parser

## Workspace persistence (PR #3, merged)

`EDE-WORKSPACE-002` is on `main` at `207a521`. It keeps ADR-005 routes and stores weddings in `public.weddings` / `public.wedding_members` for the signed-in user. Creation goes through `public.create_wedding_with_owner` (security invoker, one transaction, `auth.uid()` only). The fixture cookie is not a runtime source. Phase 3 is integrated and is not given a new overall percentage here.

## Open blockers
1. Auth callback redirect allow list for `/auth/callback` (PR #10, not merged).
2. Vercel project (later)
