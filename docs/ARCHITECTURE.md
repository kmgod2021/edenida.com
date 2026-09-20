# Edenida — Architecture

## Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.3.x** (Active LTS), App Router | Current LTS; RSC; Vercel-native |
| UI | React (framework-bundled) + TypeScript strict | |
| Styling | Tailwind CSS + CSS variables design tokens | |
| Components | **shadcn/ui** (copy-in primitives) | Own the code; no heavy UI SaaS |
| Package manager | **pnpm** | Fast, strict |
| Backend | **Supabase** PostgreSQL + Auth + Storage | One platform; RLS |
| Validation | **Zod** | Typed boundaries |
| E2E | **Playwright** | Mandatory |
| Hosting | **Vercel** | Preview + prod |
| CI | **GitHub Actions** | lint/typecheck/test/build |

Avoid extra SaaS until necessary (no Auth0, no separate CMS, no marketplace).

## App structure (target)

```
src/
  app/
    (marketing)/          # home, pricing later
    (auth)/               # login, signup
    (app)/                # authenticated shell
      w/[weddingId]/     # workspace modules
    w/[slug]/             # PUBLIC wedding website
    api/                  # selective route handlers
  components/
    ui/                   # shadcn
    brand/
    wedding/
    website-builder/
    public-site/
  lib/
    supabase/             # browser, server, middleware clients
    auth/
    validations/
    website/
  styles/
supabase/
  migrations/
  tests/                  # pgTAP / db tests
e2e/
docs/
.cursor/agents/
```

## Auth pattern
Official Supabase SSR for Next.js: cookie-based session, **`src/proxy.ts`** session refresh (Next.js 16 renamed `middleware` → `proxy`), server client for RSC/actions. Service role **server-only** for privileged jobs (e.g. RSVP token resolve via security definer RPC if needed).

## Multi-tenancy
```
auth.users → profiles
weddings ← wedding_members (role) → user
all wedding_* resources.wedding_id → membership check
```

Helper: `is_wedding_member(wedding_id)` / `has_wedding_role(...)` as `SECURITY DEFINER` with fixed `search_path`.

## Website Builder architecture

### Model
- `wedding_sites` — one primary site per wedding (MVP)
- `site_sections` — ordered list: `type`, `enabled`, `sort_order`, `content` (JSONB schema per type)
- `site_theme` — `template_id`, tokens (colors, fonts), hero asset refs

### Section types (MVP set)
Hero, Countdown, OurStory, Couple, WeddingDate, Events, Ceremony, Reception, Schedule, WeddingParty, Venue, Map, Accommodation, Travel, Gallery, DressCode, FAQ, GiftRegistry, RSVP, Contact, Footer

### Templates
Same content; different React presenters under `public-site/templates/{id}`.

### Routing
- Builder: `/(app)/w/[weddingId]/website`
- Public: `/w/[slug]` (+ `/rsvp`)
- Future: middleware host mapping for `{slug}.edenida.com`

### Publish
`status: draft | published`, `published_at`, `is_private`, `slug` unique globally among published.

## RSVP security
- `invitations.token` (opaque, high entropy)
- Rate limit RSVP endpoint
- Token maps to one guest (or household RSVP unit)
- Never return other guests

## Seating
`seating_tables` + `seat_assignments(guest_id, table_id, seat_index?)`
Source of truth for person = `guests` (no duplicate person rows).

## Parallelization constraints
**Serialize:** migrations, `package.json`, design tokens, root layout, auth middleware.
**Parallel OK (isolated branches/worktrees):** feature modules under distinct folders after foundation.

## ADRs
See `docs/adr/`.
