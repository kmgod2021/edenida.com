# ADR-005: Authenticated and Public Route Namespace Convention

## Status
Accepted — 2026-09-22

## Context
Wave A produced several incompatible route conventions before integration onto the Data Foundation baseline (`13571dd`):

| Track | Wave A route |
|---|---|
| Workspace | `/app/w/[weddingId]` |
| Website editor | `/app/w/[weddingId]/website` |
| Guests | `/app/weddings/[weddingId]/guests` |
| Planning | `/w/[slug]/planning` |
| Finance | `/app/finance` |

Those paths disagree on three boundaries: authenticated vs public, wedding UUID vs public slug, and wedding-scoped vs global app routes. `docs/ARCHITECTURE.md` previously targeted `/(app)/w/[weddingId]`, which collides with the public site at `/w/[slug]` and with the Guests prefix `/app/weddings/`.

Public slug publishing remains ADR-004. This ADR locks the application namespaces those features must use before rebase.

## Decision
Authenticated wedding management lives under `/app/weddings/[id]/…`.

Public wedding experiences live under `/w/[slug]/…`.

`[id]` is the wedding UUID (internal). `[slug]` is the public, human-readable site identifier. `/app/**` requires a member session. `/w/**` is the guest-facing site. No internal management feature is served under `/w/**`.

### Authenticated

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

### Public

```text
/w/[slug]
/w/[slug]/rsvp
/w/[slug]/rsvp/confirmation
```

### Rules
1. `/app/w/[id]` is deprecated before integration.
2. `/w/[slug]/planning` is invalid for internal planning.
3. `/app/finance` is invalid because finance must be wedding-scoped.
4. The website editor is authenticated (`/app/weddings/[id]/website`).
5. The published wedding website is public (`/w/[slug]`).
6. Guest RSVP stays public (`/w/[slug]/rsvp`, confirmation at `/w/[slug]/rsvp/confirmation`).
7. Internal RSVP administration stays authenticated (`/app/weddings/[id]/guests/rsvp`).
8. Every business entity in the authenticated app resolves through the current `wedding_id`.

The dynamic segment name in authenticated URLs is `id`, not `weddingId` or `slug`.

## Rationale
- **Tenancy clarity.** The wedding is the tenant (ADR-003). Putting `[id]` in every authenticated module URL makes the current `wedding_id` explicit for navigation, loaders, and actions.
- **Security boundary.** `/app/**` is the member session. `/w/**` is anonymous or token-scoped. Planning and finance under `/w/[slug]` would place member tools on the public origin path.
- **Stable internal id vs public slug.** UUIDs do not change when a couple edits the published slug. Public URLs stay readable and revocable without rewriting member links.
- **Simpler RLS and data integration.** One wedding id flows from the route into membership checks. A global `/app/finance` route has no wedding to authorize.
- **Predictable navigation.** Modules are siblings under `/app/weddings/[id]`, not a mix of `/app/w`, `/app/weddings`, and `/app/finance`.
- **No dashboard / published-site collision.** `/w/[id]` and `/w/[slug]` would share one dynamic segment and ambiguous meaning. Authenticated workspace paths stay off `/w`.
- **Extensibility.** Additional member modules are further segments under `[id]`. Additional public pages stay under `[slug]`. Subdomains and custom domains remain an ADR-004 concern and do not change these path roles.

## Consequences
Wave A rebases must move routes to the locked paths. Application code is unchanged by this ADR.

| Track | From | To |
|---|---|---|
| Workspace | `/app/w/[weddingId]` | `/app/weddings/[id]` |
| Website editor | `/app/w/[weddingId]/website` | `/app/weddings/[id]/website` |
| Website public | `/w/[slug]` | `/w/[slug]` (unchanged) |
| Guests | `/app/weddings/[weddingId]/guests` | `/app/weddings/[id]/guests` (segment rename) |
| RSVP public | `/w/[slug]/rsvp` | `/w/[slug]/rsvp` (unchanged) |
| Planning | `/w/[slug]/planning` | `/app/weddings/[id]/planning` |
| Finance | `/app/finance` | `/app/weddings/[id]/budget` and `/app/weddings/[id]/vendors` |

+ One namespace for membership-gated modules and one for the published site
+ Guests is already under `/app/weddings/…`; only the param name changes
+ Public RSVP and the published site stay where ADR-004 put them
− Workspace, Website editor, Planning, and Finance must retarget links, layouts, and tests on rebase
− This decision does not itself deliver a user-facing capability

## Related
- ADR-003 — tenancy root is `weddings`; resources key off `wedding_id`
- ADR-004 — published site remains `/w/{slug}`; hostnames come later
