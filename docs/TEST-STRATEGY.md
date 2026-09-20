# Edenida — Test Strategy

## Layers
1. **Static:** ESLint, TypeScript `--strict`
2. **Unit:** pure utils/validators (Vitest if/when needed)
3. **DB:** `supabase test db` — RLS allow/deny
4. **E2E:** Playwright (mandatory)

## Playwright principles
- Write tests **with** features, not after
- Prefer `getByRole`, `getByLabel`, `getByText`
- `getByTestId` only when necessary
- Web-first assertions
- Isolated projects / unique data per test
- Chromium always in CI; WebKit/Firefox at milestones
- Trace **on first retry**; upload artifacts on failure
- Viewports: desktop + mobile projects

## Critical E2E coverage (gates)

| ID | Flow |
|---|---|
| E2E-AUTH | sign up / login / logout |
| E2E-WED | create + edit wedding |
| E2E-CHK | checklist seed + complete |
| E2E-GST | create guest |
| E2E-RSVP | token RSVP submit + couple view |
| E2E-BDG | budget item + remaining |
| E2E-VND | add vendor |
| E2E-WEB | builder edit + preview |
| E2E-PUB | publish + public page |
| E2E-SEAT | assign guest to table |
| E2E-ISO | user A blocked from wedding B |

## CI order
install → lint → typecheck → unit (if any) → db tests → build → playwright (chromium)

Preview: optional second workflow on `deployment_status` success against Vercel URL.

## Definition of done (tests)
Feature DONE requires automated coverage for its critical path + manual mobile spot-check evidence (screenshot at milestones).
