# Edenida — Project Status

**Last update:** 2026-09-27
**Overall integrated progress:** **22% + PARTIAL PHASE 3**
**Production-ready progress:** **0%**

Phase 0–2 integrated weight is 22%. Phase 3 Wedding Workspace is PARTIAL. The exact Phase 3 fraction is not defined canonically. ADR-006 is accepted architecture, not implemented RSVP persistence, and it does not increase this percentage. Mock guest screens and documentation do not count as Phase 5 progress.

## Integration baselines

Historical milestones stay recorded. The newest SHA does not replace them.

| Milestone | SHA |
|---|---|
| Architecture baseline | `d3c847f9315a36f57f2418f4c218912dc99382de` |
| Workspace baseline | `207a5219853a29cc638e4487d90d568777311977` |
| Auth baseline | `0439b780135684d08543facd5ee8106044b6e02a` |
| RSVP ADR baseline / current integration baseline | `de815d173d1ed7e2cacfad6dde0ae876de4c1f0d` |

Current `main` at the start of this status sync is the RSVP ADR baseline above. It contains workspace persistence, the Auth callback, and accepted ADR-006.

| Phase | Agent | Task | Status | Completion | Tests | PR | Blocker |
|---|---|---|---|---:|---|---|---|
| 0 Research & product | COORDINATOR | EDE-PLAN-001 | DONE | 100% | n/a | — | — |
| 1 Architecture | COORDINATOR | EDE-ARCH-001 | DONE | 100% | n/a | — | — |
| 2 Foundation | COORDINATOR | EDE-FOUND-002 | DONE | 100% | smoke | synced | — |
| GitHub sync | DEVOPS-01 | EDE-GIT-001 | DONE | 100% | CI green | synced | — |
| Supabase foundation | SUPABASE-01 | EDE-DATA-001 | MERGED | see baseline | pgTAP+auth e2e | #1 | — |
| Security harden R1 | SECURITY-01 | EDE-DATA-001-R1 | MERGED | see baseline | role matrix + local Auth E2E | #1 | — |
| Route namespace | ARCH-01 | EDE-ARCH-001 | LOCKED | n/a | docs only | [#8](https://github.com/kmgod2021/edenida.com/pull/8) merged | Baseline `d3c847f` |
| 3 Wedding workspace | WORKSPACE-02 | EDE-WORKSPACE-002 | MERGED | PARTIAL | persistence + pgTAP + e2e | [#3](https://github.com/kmgod2021/edenida.com/pull/3) | Baseline `207a521` |
| Auth email callback | AUTH-01 | EDE-AUTH-001 | MERGED | n/a | unit + auth e2e; post-merge CI PASS | [#10](https://github.com/kmgod2021/edenida.com/pull/10) | — |
| RSVP security architecture | SECURITY-02 | EDE-SEC-RSVP-001 | ACCEPTED / MERGED | n/a | docs only; contract frozen | [#9](https://github.com/kmgod2021/edenida.com/pull/9) | Baseline `de815d1` |
| Guests + RSVP persistence | — | — | NOT IMPLEMENTED | 0% | — | — | ADR-006 is the contract; persistence is not built |

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

## Auth email callback (PR #10, merged)

`EDE-AUTH-001` is on `main` at `0439b780135684d08543facd5ee8106044b6e02a`.

- `/auth/callback` is integrated
- Authorization-code exchange is integrated
- Safe internal `next` is integrated (default `/app`)
- Confirmation-required signup UX is integrated (“Check your email” when Auth returns no session)
- Signup `emailRedirectTo` uses the trusted public origin: `NEXT_PUBLIC_SITE_URL`, then `https://$VERCEL_URL`, then localhost in development
- No service-role
- No `SUPABASE_SECRET_KEY`
- Workspace regression: none
- Post-merge CI: PASS

The cloud Auth callback allow list for `/auth/callback` is configured. It is not an open blocker.

## Open items

### Engineering blockers

None for starting Guests + RSVP persistence.

ADR-006 is accepted and frozen. Implementation may begin after this status sync is merged. PR #4 is salvage and reference only, so it is not a blocker. Guests persistence does not exist yet.

### Environment / release follow-ups

These are release/readiness follow-ups, not blockers for starting Guests + RSVP persistence. They do not change production-ready progress from 0%, and they do not undo Auth integration.

1. `edenida.com` is not yet attached to the Vercel project. Production email confirmation URLs are configured for `https://edenida.com`, but real end-to-end production reachability is not complete until the domain is attached.
2. `edenida-com` Preview is missing `NEXT_PUBLIC_SUPABASE_URL`. Real Preview cloud signup cannot yet run there.
3. Live cloud email confirmation E2E = NOT EXECUTED.

## RSVP security architecture (ADR-006)

```text
ADR-006: ACCEPTED / MERGED
PR: #9
Merge SHA: de815d173d1ed7e2cacfad6dde0ae876de4c1f0d
Implementation contract: FROZEN
```

ADR-006 defines the architecture for the upcoming Guests/RSVP persistence implementation. It does not mean RSVP persistence exists. Normative detail: `docs/adr/ADR-006-public-rsvp-token.md`.

Frozen decisions, summarized only:

- one invitation = one guest
- 256-bit opaque credential
- raw token never stored
- `token_hash` and `session_hash` are not bearers
- no service-role
- no `SUPABASE_SECRET_KEY`
- public `SECURITY INVOKER` wrappers
- non-exposed `rsvp_internal` `SECURITY DEFINER` boundary
- postgres-owned single-secret Vault pepper accessor
- an IP limiter is not currently a security dependency

A change to those decisions needs a new ADR or an ADR amendment plus security review.

## Guests / RSVP implementation

```text
Guests persistence: NOT IMPLEMENTED
RSVP persistence: NOT IMPLEMENTED
ADR/security architecture: READY FOR IMPLEMENTATION
```

## Legacy Guests PR #4

PR [#4](https://github.com/kmgod2021/edenida.com/pull/4) at `3b7e6f1f963e9105b89be91f42fa49b270d4994d` is DRAFT, a legacy mock implementation, not integrated, and not merge-ready. It is not implementation progress.

It is a reference for selective salvage: domain types, UI concepts, guest list screens, RSVP form concepts, tests, and interaction ideas.

It also contains obsolete runtime architecture: a memory repository, fixtures, fixture tokens, old token hashing, a pre-ADR security proposal, and stale status claims.

PR #4 must not be merged or rebased wholesale as the production Guests implementation.

## Next engineering action

```text
Next implementation track: Guests + RSVP persistence
Starting baseline: current main after this status sync is merged
Strategy: fresh branch from the current integration baseline;
selectively reuse validated UI and domain concepts from PR #4;
implement persistence and public RSVP according to frozen ADR-006.
```

That implementation is not started here. It needs its own migration, RLS and grants, roles, RPCs, Vault setup, pgTAP, direct Data API security tests, application integration, Playwright, and security review.

## EDE-DATA-001 / R1 notes
- DEVELOPMENT DB: foundation + RLS recursion fix + `20260921040000_harden_foundation_authorization`
- Helpers in `private.*` (SECURITY DEFINER, `search_path=''`); public helpers removed
- Wedding UPDATE via `private.can_edit_wedding` (viewer DENY); column grants exclude `id`/`created_by`/`created_at`
- Auth E2E: real signup/login/logout against **local** Supabase (`enable_confirmations=false`); no `auth.users` SQL seeds
- DB tests: official `supabase test db` (CI); no custom pgTAP parser

## Workspace persistence (PR #3, merged)

`EDE-WORKSPACE-002` is on `main` at `207a521`. It keeps ADR-005 routes and stores weddings in `public.weddings` / `public.wedding_members` for the signed-in user. Creation goes through `public.create_wedding_with_owner` (security invoker, one transaction, `auth.uid()` only). The fixture cookie is not a runtime source. Phase 3 is PARTIAL and is not given a new overall percentage here.
