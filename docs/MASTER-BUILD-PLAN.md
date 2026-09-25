# EDENIDA MASTER BUILD PLAN

**Coordinator:** EDENIDA-COORDINATOR (this session)
**Date:** 2026-09-20
**Repo state at planning:** empty directory → git init on `main`

---

## A. Research verdict

Benchmarks confirm the must-have loop: **Website ↔ Guests ↔ RSVP ↔ Dashboard**, plus checklist, budget, vendors, seating, timeline. Edenida wins with premium calm UX + secure SaaS tenancy + best-in-class block website — not marketplace sprawl.

## B. MVP proposition
See `docs/MVP.md`. P0 includes foundation through vendors; P1 seating/timeline/files required for mandate exit journey.

## C. Architecture
See `docs/ARCHITECTURE.md` + ADRs 001–005. Authenticated vs public route namespaces: ADR-005.

## D. Wedding Website Builder
Block-based; content ≠ presentation; 6 templates; `/w/[slug]`; private/public; RSVP section tokenized.

## E. Data model
See `docs/DATABASE.md`.

## F. Security model
See `docs/SECURITY.md`. RLS + membership + hashed invitation tokens.

## G. Agents required (activate by phase)

| Agent | When |
|---|---|
| EDENIDA-COORDINATOR | always |
| EDENIDA-PRODUCT | Phase 0 (done for v1) |
| EDENIDA-ARCHITECT | Phase 1 (done for v1) |
| EDENIDA-UI | Phase 2+ design system / builder UX |
| EDENIDA-SUPABASE | Phase 2+ schema/RLS |
| EDENIDA-FEATURE-* | Phase 3+ features (isolated) |
| EDENIDA-QA | after each feature slice |
| EDENIDA-SECURITY | Phase 5+ and Phase 10 |
| EDENIDA-DEVOPS | Phase 2 CI, Phase 11 prod |

## H. Dependency graph
See `docs/ROADMAP.md`.

## I. Test strategy
See `docs/TEST-STRATEGY.md`.

## J. Technical risks

| Risk | Mitigation |
|---|---|
| RLS gaps → data leak | db tests + isolation E2E; security review gate |
| Website builder scope creep | hard section catalog; no free-canvas |
| RSVP abuse / enumeration | hashed tokens, rate limit, narrow RPC |
| Parallel agent collisions | serialize migrations/package/layout; worktrees |
| Supabase project not yet provisioned | scaffold code + migrations; block prod until secrets |
| Next 16 Windows security advisory context | pin patched 16.3.3+; prefer Vercel Linux runtime |
| Empty remote / no Vercel project yet | local+CI first; human connects GitHub/Vercel |

## K. Decisions locked (no human block)
Stack, builder approach, tenancy, public slug routing (ADR-004), authenticated `/app/weddings/[id]` namespace (ADR-005), template list, role enum, weighted completion model.

## L. Decisions needing human later (non-blocking for foundation)
1. Create Supabase project + provide URL/anon/service keys
2. Create GitHub remote + Vercel project linkage
3. Production domain DNS for edenida.com
4. Confirm primary UI language default (FR vs EN) — **default FR for marketing, EN code**

## M. Parallelization plan
- **Now (serial):** Phase 2 foundation in this checkout
- **After Phase 3:** FEATURE tracks A–D on isolated branches/worktrees
- **Never parallel:** migrations, package.json, tokens, root layout, middleware

## N. Autonomous construction protocol (next steps)
1. ✅ Research + docs
2. → Scaffold Next.js 16.3 + tooling
3. → Supabase folder + initial migration skeleton
4. → Auth UI + middleware stubs
5. → Design tokens + shadcn
6. → CI workflow
7. → Playwright scaffold + smoke
8. → Verify lint/typecheck/build
9. → Status update → Phase 3

## O. Self-review (plan)

| Check | Result |
|---|---|
| Product vs architecture contradiction? | None critical |
| P0 website adequately prioritized? | Yes (weight 20%) |
| Security as delivery condition? | Yes |
| Over-documentation? | Lean ADRs only (5) |
| Blocking human decision for coding start? | No — foundation can proceed without live Supabase (env stubs) |
| One-shot chaos risk? | Controlled by phases + DoD |

**Verdict:** Plan coherent. Proceed to Phase 2 foundations.
