# Wave A — integration and regression plan

**Track:** QA (`EDENIDA-QA-01` / `EDE-QA-CONTINUOUS-001`)
**Mode:** review only. No feature-code fixes in this branch.
**Base reviewed:** `origin/main` @ `ce23b51e76964d3c3803ec6d18365fdf60ecbf88`
**Security track reviewed:** [PR #1](https://github.com/kmgod2021/edenida.com/pull/1) `EDE-DATA-001` (`agent/edenida-supabase-01/ede-data-001-supabase-integration` @ `57a109b`). There is no separate `EDE-DATA-001-R1` head; this plan treats PR #1 as the Security / data-foundation gate.
**Feature tracks reviewed:** mission contracts only. As of this review, origin has no branches or PRs for workspace, website, guests, planning, or finance. Implementation was still in progress and is not signed off.

Wave A acceptance for feature tracks is `READY_FOR_DATA_INTEGRATION` (fixtures), not phase DONE. Critical E2E gates in `docs/TEST-STRATEGY.md` stay open until Wave B runs them against real membership and RLS.

## How to use this plan

Feature owners implement the proposed fixes. QA does not edit those branches.

Do not weaken or delete `e2e/smoke.spec.ts`, PR #1 `e2e/auth.spec.ts`, or pgTAP files to absorb route or copy changes. Update assertions only when the product contract changed, and say so in the PR.

`docs/STATUS.md` is a single-writer file during Wave A (Coordinator). Parallel percentage edits will conflict and have already diverged in draft reasoning (one track sketched Phase 5 at 60% and overall 31% while Phase 3–4 and 6–7 are still 0%). That arithmetic does not match `docs/MVP.md` §5. This plan does not change `docs/STATUS.md`.

---

## 1. Wave A integration / regression matrix

Legend: **A** = required before `READY_FOR_DATA_INTEGRATION`. **B** = required after Security merge, before the gate is closed. **Hold** = not this wave.

| ID | Flow | Owner | Wave A evidence (mocks) | Must not regress | Wave B (after PR #1 merges) | Now |
|---|---|---|---|---|---|---|
| E2E-AUTH | Sign up / login / logout | Security PR #1 | Keep smoke reachability of `/signup` and `/login` | `e2e/smoke.spec.ts` headings and CTA | `e2e/auth.spec.ts` login → reload → logout → login. Real signup stays blocked while email confirmation is ON; do not pretend the form-only test is signup | Smoke 3 cases on `main`. Auth spec exists only on PR #1 and `test.skip`s without Supabase env |
| E2E-WED | Create + edit wedding | Workspace `EDE-WORKSPACE-001` | `e2e/workspace.spec.ts`: empty onboarding, validation error, create, dashboard title, edit settings, second session cannot open the first wedding id | Do not delete PR #1 session/logout UI on `src/app/app/page.tsx` without a replacement assertion | Same flow via `weddings` + `wedding_members`, actor = `auth.uid()` | Not on `main`. `/app` is a static placeholder |
| E2E-CHK | Checklist seed + complete | Planning `EDE-PLANNING-001` | `e2e/planning.spec.ts`: template seed, complete task, progressbar, overdue filter, add task. Pin `asOf` (do not use `Date.now()`) | French tab/checkbox/progressbar names stay stable | DB seed from wedding date; dashboard reads the same counts | Not started on origin |
| E2E-GST | Create guest | Guests `EDE-GUEST-001` | `e2e/guests.spec.ts`: create guest, search/filter, household, empty and error fixtures | Guest PII never rendered on `/w/[slug]` | CRUD against RLS; anon `SELECT` guests denied | Not started on origin |
| E2E-RSVP | Token RSVP + couple view | Guests | Public form for one fixture token; confirmation shows that guest only; invalid token is not-found; couple dashboard count changes | No guest-list payload on the public response | Hashed token (≥128 bits), rate limit, single-guest RPC. Security must accept the proposal before it is treated as final | Not started. Token design is explicitly not locked |
| E2E-BDG | Budget item + remaining | Finance `EDE-FINANCE-001` | Add item; assert remaining with the **one** formula in §3 | Currency minor units; default CAD | Same numbers from `budget_*` / `payments` | Not started. Formula was still inconsistent in the finance draft |
| E2E-VND | Add vendor | Finance | Add vendor; link optional budget item; contact fields visible only in the workspace | Vendor email/phone not in public site data or `localStorage` on an unauthenticated marketing route | Member-only rows | Not started |
| E2E-WEB | Builder edit + preview | Website `EDE-WEB-001` | Edit hero text, disable/reorder a section, switch template, content still present, desktop and mobile preview | Content ≠ presentation (ADR-002) | Persist `wedding_sites` / `site_sections` | Not started. `src/app/w/[slug]/page.tsx` is `notFound()` |
| E2E-PUB | Publish + public page | Website (later slice) | **Hold.** Do not replace `notFound()` with a fixture site in Wave A | Unpublished slug stays 404 | Published slug 200; unpublished 404; private site `noindex` and no guest PII | Open |
| E2E-SEAT | Assign guest to table | Phase 8 | **Hold** | Guests remain the only person record | After guests RLS | Open |
| E2E-ISO | User A blocked from wedding B | Security, then every feature | Workspace mock: other session id gets no wedding. Guests: other `session` key gets no guests | PR #1 pgTAP: A cannot select/update/delete B; forged membership `42501`; anon weddings `42501` | Playwright two-user test plus pgTAP on every new table | DB isolation on PR #1 for `profiles` / `weddings` / `wedding_members` only. No Playwright isolation |
| INT-DASH | Dashboard matches module summaries | Workspace reads; others export | Each track unit-tests its own summary function. Do not assert cross-module totals in Wave A | Placeholder zeros must be labeled fixtures, not live metrics | One wedding shows website status, guest/RSVP counts, checklist x/y, budget remaining | Open. Memory stores are not shared |
| INT-ROUTE | One URL tree | Coordinator + all tracks | Routes in §3 only | Public dynamic segment stays `w/[slug]` | Same paths, server data | **Conflict in draft plans** (see §3) |
| REG-MKT | Marketing + auth shell | All | `e2e/smoke.spec.ts` green on desktop | Copy: brand, tagline, “Créer mon espace mariage”, “Créer un compte”, “Connexion” | Same, plus auth spec | Green on current CI contract (desktop only) |
| REG-DB | Foundation RLS | Security | PR #1 `supabase/tests/database/01_*.sql` (18) and `02_*.sql` (11) | Do not edit applied foundation SQL in place | New tables add policies + pgTAP before feature UI is called integrated | On PR #1, not on `main` |
| A11Y-MOB | Mobile + a11y spot check | Each feature | §4 checklist checked in the feature PR (Pixel 7 project + keyboard). Screenshot evidence at milestone, not committed binaries | `lang="fr"`, labels, one `h1` | Repeat on integrated shell | No axe runner. CI does not run `chromium-mobile` |

### Regression order when a feature PR opens

1. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
2. `pnpm test:e2e --project=chromium-desktop` including existing smoke
3. `pnpm test:e2e --project=chromium-mobile` for the new spec (local or CI once G-CI-MOBILE is fixed)
4. If the branch contains `supabase/**` (it must not, in Wave A): `pnpm test:db` / `supabase test db`
5. Rebase onto merged PR #1 before Wave B and repeat 1–3 plus `e2e/auth.spec.ts`

---

## 2. Coverage gaps vs `docs/TEST-STRATEGY.md`

Strategy layers: static (ESLint, `tsc --strict`) → unit (Vitest) → DB (`supabase test db`) → Playwright. CI order on `main`: install → lint → typegen → typecheck → unit → build → Playwright **chromium-desktop only**. Trace is `on-first-retry`. HTML report uploads on failure (`playwright-report`, `test-results`, 14 days).

### What exists

| Layer | `main` @ `ce23b51` | PR #1 only |
|---|---|---|
| Unit | `src/lib/validations/auth.test.ts`: 3 cases (`cn`, valid signup, short password). Vitest include is `src/**/*.test.ts` (node, no jsdom) | unchanged pattern; `pg`/`dotenv` added for DB runner |
| E2E | `e2e/smoke.spec.ts`: home, signup heading, login heading | `e2e/auth.spec.ts`: login/persistence/logout, signup fields visible, invalid email. Skipped when publishable env is missing |
| DB | none | schema 18 + isolation 11. Workflow `.github/workflows/db-tests.yml` uses local `supabase test db` (no remote secrets) |
| Projects | `chromium-desktop`, `chromium-mobile` (Pixel 7) | same, plus dotenv `.env.local` |
| A11y automation | none | none |
| WebKit / Firefox | not configured (allowed to wait for milestones) | same |

### Gaps (do not close by deleting a gate)

| Gap | Severity | Why it matters | Owner to close | Wave |
|---|---|---|---|---|
| G-E2E-GATES | P0 for MVP exit, expected in Wave A | 10 of 12 critical flows have zero specs on `main` | Feature owners, files in §1 | A = mock specs; B = real |
| G-CI-MOBILE | P1 | `chromium-mobile` exists but `.github/workflows/ci.yml` runs `--project=chromium-desktop` only. Mobile regressions will not fail CI | DevOps, after feature specs exist. Do not drop desktop | A |
| G-AUTH-SKIP | P0 for calling E2E-AUTH done | Skip without env is a skip, not a pass. Quality CI does not inject `NEXT_PUBLIC_SUPABASE_*`. Signup never submits | Security + DevOps: secrets job or local Supabase auth. Keep the skip from failing forks; surface skip count in the job summary | B |
| G-AUTH-SIGNUP | P1 | Email confirmation ON (PR #1 notes). Browser signup cannot finish | Security: keep DB seed helper for login; add an explicit test that unconfirmed signup does not enter `/app` | B |
| G-ISO-E2E | P0 for E2E-ISO | Isolation is pgTAP-only and only on foundation tables | Security: two-browser Playwright. Each feature: anon/non-member deny in pgTAP when tables exist | B |
| G-ROLES | P1 | No partner / collaborator / viewer policy tests | Security when members UI exists | B |
| G-PUB | P0 for E2E-PUB | Public page is hard `notFound()` | Website publish slice. Wave A must not “fix” this with an open fixture | B |
| G-RSVP-SEC | P0 | Required security tests (invalid token, anon cannot read guests, no PII on public payloads) have no home yet | Guests proposal + Security review. Wave A mocks must still assert the negative cases | A negative UI; B pgTAP/RPC |
| G-SEAT | Hold | Phase 8 | later | — |
| G-A11Y-AXE | P2 for Wave A | WCAG 2.2 AA is the design-system target; no scanner is installed. `package.json` is frozen for feature tracks | Phase 10. Until then use §4. Do not add a dependency inside feature PRs | 10 |
| G-DASH | P1 | No shared summary contract, so INT-DASH cannot be written yet | Workspace publishes the type; other tracks export pure functions | A contract; B test |
| G-PREVIEW | P2 | Optional `deployment_status` Playwright workflow from the strategy does not exist (no Vercel project) | DevOps | 11 |
| G-STATUS-RACE | P1 process | Parallel `docs/STATUS.md` edits will drop rows or invent % | Coordinator only | now |

Wave A is allowed to ship with G-E2E-GATES satisfied only at mock depth. It is not allowed to mark E2E-PUB, E2E-ISO, or E2E-SEAT done.

---

## 3. Cross-feature integration risks

### P0 — route collision on `/w/[param]`

Next.js allows one dynamic segment name at `src/app/w/[param]`. `main` already has `src/app/w/[slug]/page.tsx` (`notFound()`, ADR-004 public slug).

Draft plans disagree:

| Track | Path they were heading toward | Problem |
|---|---|---|
| Website | `src/app/(app)/w/[weddingId]/website` | Same URL level as `[slug]` |
| Planning | `/w/[weddingId]/planning` and `/w/wedding_demo/planning` | Same |
| Guests | Rejected `/w/[weddingId]` after noticing the clash; fallback `/app/weddings/[weddingId]/guests` plus public RSVP | Fallback is the right shape |
| Workspace | `/app` onboarding and `/app/...` wedding routes; also plans to replace `src/app/app/page.tsx` | Collides with PR #1’s file, not with the public slug |
| Finance | `src/app/app/finance/page.tsx` | No `weddingId`; unscoped URL |

**Proposed contract (Coordinator locks it; QA will flag any other tree):**

| Surface | Path |
|---|---|
| Marketing | `/` |
| Auth | `/login`, `/signup` |
| Workspace entry | `/app` (keep PR #1 session + Déconnexion until the shell replaces them with equivalent roles) |
| Wedding shell | `/app/weddings/[weddingId]` |
| Builder | `/app/weddings/[weddingId]/website` |
| Guests | `/app/weddings/[weddingId]/guests` |
| Planning | `/app/weddings/[weddingId]/planning` |
| Finance | `/app/weddings/[weddingId]/finance` |
| Public site | `/w/[slug]` — stays `notFound()` through Wave A |
| Public RSVP | `/w/[slug]/rsvp` (query token), confirmation as a child route |

`/w/camille-et-julien` is a **slug**, not a wedding id. Do not reuse it as `[weddingId]`.

### P0 — `src/app/app/page.tsx` after Security merges

PR #1 replaces the placeholder with session email and Déconnexion. The workspace track’s plan is to turn that file into onboarding. A merge either way drops logout or drops onboarding.

Proposed fix: workspace rebases onto PR #1 and keeps a `Déconnexion` control (`getByRole('button', { name: /Déconnexion/i })`) whenever a Supabase user is present. Auth spec assertions on “Votre espace mariage” must be updated in the **security** follow-up only if the heading contract changes; do not delete the login/logout test.

### P0 — four different fake backends

| Track | Isolation idea seen in draft | Wave B break |
|---|---|---|
| Workspace | `edenida_workspace_session` cookie + `globalThis` memory | Cookie must not clobber Supabase auth cookies. `proxy.ts` calls `getUser()` on every path once env is set |
| Guests | `?session=` and `?scenario=` | Query fixtures must not ship as the production API |
| Planning | in-memory repository; refresh will not persist | Dashboard counts die on reload |
| Finance | `localStorage` demo adapter | Vendor email/phone sit in the browser with no auth gate |

Wave A may keep these behind repository interfaces. Wave B replaces every adapter with the server client and RLS. QA will not accept a Wave B PR that still reads guest or vendor PII from `localStorage` or a shared module store.

`src/proxy.ts` is forbidden for feature tracks. After PR #1, unauthenticated `/app/**` still renders (the proxy refreshes the session; it does not redirect). Mock UIs will be world-readable on preview until a later auth gate. Do not put real PII in fixtures that deploy.

### P0 — guest PII and RSVP token

`docs/SECURITY.md` is the contract: opaque token, store the hash, one guest, no list, Zod on input. Guests must document a proposal, not pick a final design alone.

Wave A tests that are still mandatory on mocks:

- Valid fixture token shows one guest and submits
- Unknown token renders not-found, not an empty list
- Response body / visible text does not include another guest’s name, email, or phone
- Couple view updates; public view does not show household mates

Wave B adds: anon `SELECT` on `guests` denied, token brute-force rejected, unpublished site has no RSVP.

### P1 — dashboard numbers will not match

Workspace summary drafts use equal module weights and fixture zeros. Finance drafts disagreed on remaining (committed − paid vs budget ceiling − committed vs ceiling − estimated). Planning progress is done/total with a pinned clock. Website status is `none | draft | published`.

Proposed formulas, to lock before assertions:

- Checklist progress: `completed / total` tasks (exclude soft-deleted)
- Budget remaining: `totalBudgetMinor - committedMinor` (currency minor units, ISO code from the wedding, default `CAD`)
- Item balance: `committedMinor - paidMinor` (label it balance, not “budget remaining”)
- Guest RSVP: counts by `pending | attending | declined` only
- Website: `empty` if no site, `started` if draft, `complete` if published

Until those are shared types, INT-DASH stays red on purpose.

### P1 — shared files

Serialize, do not parallel-edit: `supabase/migrations/**`, `package.json`, `pnpm-lock.yaml`, `src/app/layout.tsx`, `src/app/globals.css`, design tokens, `src/proxy.ts`, `docs/STATUS.md`, `playwright.config.ts`, `vitest.config.ts`.

Feature tests that need DOM should use `src/**/*.test.ts` plus `renderToStaticMarkup` / `React.createElement`, because Vitest does not include `tsx` and `package.json` cannot grow `@testing-library/react` in Wave A. Interactive behavior belongs in Playwright, not in a weakened unit layer.

### P1 — copy and locale

`html lang="fr"`. Accessible names in current smoke/auth specs are French. New specs must use `getByRole` / `getByLabel` in French. Do not assert English placeholders that the UI does not render.

### After Security merge → Wave B checklist

1. Rebase each feature branch onto `main` (PR #1 contents).
2. Re-run smoke + auth + that feature’s spec on desktop and mobile.
3. Confirm `getUser()` in `proxy.ts` does not redirect loops with the workspace session cookie.
4. Delete demo adapters from server components that ship to production.
5. Add pgTAP for every new exposed table before enabling the live repository: RLS on, anon denied for PII, member A cannot read wedding B, grants explicit.
6. Run E2E-ISO across two confirmed users (PR #1 helper `scripts/dev-auth-helpers.mjs`), not two cookies.
7. Only then change track status from `READY_FOR_DATA_INTEGRATION` toward phase completion. Coordinator writes `docs/STATUS.md`.

---

## 4. Mobile and accessibility checklist

Run with `pnpm test:e2e --project=chromium-mobile` (Pixel 7). Also walk the keyboard list once per track. Design system target: WCAG 2.2 AA as a reasonable bar (focus, labels, contrast, semantics, keyboard). No scanner is installed; a checkbox in the PR is the Wave A evidence.

### Every track

- [ ] One `h1` on the page
- [ ] Every input has a visible `<label>` (placeholder is not a label)
- [ ] Errors use `role="alert"` and are tied to the field
- [ ] Primary actions are `button` or `a`, not clickable `div`s
- [ ] Focus ring visible on inputs, links, and buttons (tokens, not removed outline)
- [ ] Status is not color-only (RSVP, overdue, budget over)
- [ ] At 412×915 (Pixel 7): no horizontal scroll; no control under a fixed bar; tap targets at least ~44px
- [ ] Empty, loading, and error states each have one next action (`docs/DESIGN-SYSTEM.md`)
- [ ] `prefers-reduced-motion` honored if a reorder/publish animation exists
- [ ] Spec uses role/label selectors; `getByTestId` only if role cannot see the control

### Workspace

- [ ] Mobile nav opens and closes by button name; focus moves into the panel
- [ ] Create-wedding form usable one-handed; date input not clipped
- [ ] Dashboard countdown and progress readable without a table

### Website builder

- [ ] Preview control switches desktop/mobile **and** the Pixel 7 project screenshots the real viewport
- [ ] Section reorder is keyboard-reachable (buttons), not drag-only
- [ ] Template switch keeps hero text (assert in both viewports)
- [ ] Public page (Wave B): heading order, skip or landmark `main`, images have names when they convey content

### Guests

- [ ] Desktop table becomes a stacked list on mobile; row actions still named
- [ ] Filter/search has an accessible name; results announce empty
- [ ] Public RSVP can be completed with keyboard only, no account
- [ ] Confirmation does not expose other guests (mobile and desktop)

### Planning

- [ ] Tabs (`Checklist`, `Événements`, `Jour J`) are `tab`/`tablist` and arrow-key reachable
- [ ] Task completion is `checkbox` with an accessible name
- [ ] Progress uses `progressbar` with a name and value
- [ ] Overdue filter works on mobile without covering the list

### Finance

- [ ] Currency visible as CAD (or the wedding ISO code), not a bare number
- [ ] Remaining figure has an accessible name that matches the locked formula
- [ ] Vendor contact fields are not the page’s only content on a 320px width; they stay off the public site

---

## 5. Playwright artifact expectations

Configured today in `playwright.config.ts` and `.github/workflows/ci.yml`:

| Expectation | Required | Actual |
|---|---|---|
| Trace on first retry | Yes | `trace: "on-first-retry"` |
| Retries | 2 in CI, 0 locally | yes |
| Workers in CI | 1 | yes |
| `forbidOnly` in CI | yes | yes |
| HTML reporter, do not open | yes | `html` + `open: "never"` |
| Upload on failure | `playwright-report` and `test-results`, 14 days | yes, quality job only |
| Chromium desktop in CI | always | yes |
| Chromium mobile in CI | strategy says both projects | **missing** (G-CI-MOBILE) |
| WebKit / Firefox | milestones only | not yet |
| Unique data per test | yes | auth spec uses a random email; feature specs must not share one mutable fixture across workers |
| Screenshots | milestone evidence, not repo binaries | not configured as a Playwright artifact |
| Video | not required | off |

Proposed (DevOps / QA, not this branch): set `screenshot: "only-on-failure"` so the uploaded `test-results` folder contains the failure frame. Do not turn video on in CI until traces prove insufficient.

Feature PR description should link:

- the spec file
- the desktop project result
- the mobile project result
- one failure-trace note if a test was retried

Do not commit `playwright-report/` or `test-results/`.

### Spec files QA will look for

| File | Track | Minimum cases |
|---|---|---|
| `e2e/smoke.spec.ts` | existing | keep 3 |
| `e2e/auth.spec.ts` | PR #1 | keep login/logout; do not remove the env skip without a secrets plan |
| `e2e/workspace.spec.ts` | 3 | onboarding, validation, create, dashboard, cross-session deny |
| `e2e/website.spec.ts` | 4 | edit, reorder or disable, template switch preserves content, both previews |
| `e2e/guests.spec.ts` | 5 | create, filter, public RSVP happy path, invalid token, no second guest visible |
| `e2e/planning.spec.ts` | 6 | seed, complete, overdue, add task, add event, timeline order, empty/error |
| `e2e/finance.spec.ts` | 7 | add item, remaining, add vendor |

---

## 6. Proposed fixes (feature owners implement)

1. **Coordinator** locks the route table in §3 before any feature PR merges.
2. **Workspace** rebases onto PR #1 and preserves logout; does not own `docs/STATUS.md`.
3. **Website** does not mount the builder on `/w/[weddingId]` and does not remove public `notFound()` in Wave A.
4. **Guests** keeps workspace UI under `/app/weddings/[weddingId]/guests` and public RSVP under `/w/[slug]/rsvp`; ships the token proposal for Security; negative tests in Wave A.
5. **Planning** uses `/app/weddings/[weddingId]/planning` and a fixed `asOf` clock.
6. **Finance** uses the wedding-scoped path and the remaining formulas in §3; no vendor PII in `localStorage` on a route that preview can serve without auth.
7. **Security** keeps pgTAP; adds role and feature-table tests in Wave B; does not treat a skipped Playwright project as E2E-AUTH done.
8. **DevOps** adds `chromium-mobile` to CI without removing desktop, after at least one feature spec exists so the job tests product behavior.

---

## 7. EDENIDA PARALLEL BUILD STATUS (Track QA, Wave A)

| Field | Value |
|---|---|
| Track | QA |
| Task | `EDE-QA-CONTINUOUS-001` |
| Wave | A (review only) |
| Status | **PLAN_PUBLISHED** |
| Branch | `agent/edenida-qa-01/ede-qa-continuous-001` |
| Base | `ce23b51e76964d3c3803ec6d18365fdf60ecbf88` |
| Code changes | none (docs only) |
| Migrations | none |
| Tests added or weakened | none |
| Feature PRs reviewed | none on origin yet |
| Security PR | #1 open, not merged, not re-tested in this pass |
| Phase 10 completion | unchanged at **0%** (`docs/STATUS.md`). A plan is not a hardening pass |
| Overall completion | unchanged at **22%**. Not recalculated |

### Measurable review checklist (this pass)

| Check | Result |
|---|---|
| `docs/TEST-STRATEGY.md` gates mapped | 12/12 IDs in §1 |
| Playwright config vs CI compared | mobile project gap recorded |
| PR #1 test files read | auth spec, pgTAP 18+11, db workflow, middleware |
| Parallel track missions read | workspace, website, guests, planning, finance |
| Route conflict called | yes, P0 |
| `docs/STATUS.md` edited | no (collision avoidance) |

Next QA pass: when the first feature PR exists, score it against §1 and §4. Do not merge feature branches from this track.
