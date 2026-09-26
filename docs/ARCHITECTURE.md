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
    app/                  # authenticated shell → /app
      weddings/
        new/              # /app/weddings/new
        [id]/             # wedding UUID; all member modules
          website/
          guests/         # + households, rsvp (admin)
          planning/
          budget/
          vendors/
          settings/
    w/[slug]/             # PUBLIC wedding website → /w/[slug]
      rsvp/               # + rsvp/confirmation
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

Email confirmation returns to `/auth/callback`, which exchanges the authorization code and redirects to an internal `next` path (default `/app`). Signup sets `emailRedirectTo` from the trusted public origin: `NEXT_PUBLIC_SITE_URL` when valid, otherwise `https://$VERCEL_URL`, otherwise `http://localhost:3000` in development. That origin is not a secret and is not taken from request Host headers. When Auth returns no session, signup stays on a “Check your email” state.

## Multi-tenancy
```
auth.users → profiles
weddings ← wedding_members (role) → user
all wedding_* resources.wedding_id → membership check
```

Helpers live in `private` (not Data API–exposed): `is_wedding_member`, `is_wedding_owner`, `is_wedding_creator`, `can_edit_wedding` — `SECURITY DEFINER` with `search_path = ''`. Wedding UPDATE uses `can_edit_wedding` (excludes `viewer`).

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
Locked in [ADR-005](adr/ADR-005-authenticated-public-route-namespace.md). `[id]` is the wedding UUID. `[slug]` is the public site identifier. `/app/**` is authenticated. `/w/**` is public. No member-management feature is served under `/w/**`.

Authenticated:

```text
/app
/app/weddings/new
/app/weddings/[id]
/app/weddings/[id]/website
/app/weddings/[id]/guests
/app/weddings/[id]/guests/households
/app/weddings/[id]/guests/rsvp
/app/weddings/[id]/planning
/app/weddings/[id]/budget
/app/weddings/[id]/vendors
/app/weddings/[id]/settings
```

Public (ADR-004 slug; hostnames later):

```text
/w/[slug]
/w/[slug]/rsvp
/w/[slug]/rsvp/confirmation
```

Rules:

1. `/app/w/[id]` is deprecated before Wave A integration.
2. `/w/[slug]/planning` is not internal planning.
3. `/app/finance` is not a finance route; budget and vendors are wedding-scoped.
4. The website editor is authenticated. The published site is public.
5. Public RSVP stays on `/w/[slug]/rsvp`. Internal RSVP admin stays on `/app/weddings/[id]/guests/rsvp`.
6. Authenticated modules resolve data through the route `id` (`wedding_id`).

Filesystem note: `src/app/app/` is a real URL segment (`/app`), not a route group. A group named `(app)` would drop `/app` from the URL.

#### Wave A integration route map

Use this map when rebasing feature branches onto the Data Foundation baseline. Do not treat the “current” column as supported.

| Track | Current Wave A route | Locked route |
|---|---|---|
| Workspace | `/app/w/[weddingId]` | `/app/weddings/[id]` |
| Website editor | `/app/w/[weddingId]/website` | `/app/weddings/[id]/website` |
| Website public | `/w/[slug]` | `/w/[slug]` |
| Guests | `/app/weddings/[weddingId]/guests` | `/app/weddings/[id]/guests` |
| RSVP public | `/w/[slug]/rsvp` | `/w/[slug]/rsvp` |
| Planning | `/w/[slug]/planning` | `/app/weddings/[id]/planning` |
| Finance | `/app/finance` | `/app/weddings/[id]/budget` + `/vendors` |

Future: host mapping for `{slug}.edenida.com` (ADR-004) does not move member modules onto the public host.

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
