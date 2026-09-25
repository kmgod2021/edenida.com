# Edenida — MVP Scope

**MVP exit criteria:** a real couple can complete the end-to-end journey in §3 with security isolation. Not a mockup.

## 1. In scope (P0)

| # | Capability | Acceptance sketch |
|---|---|---|
| 1 | Auth (sign up / login / logout / session restore) | Supabase Auth SSR |
| 2 | Wedding workspace create + settings | One wedding project; couple names, date, locale |
| 3 | Members: OWNER / PARTNER / COLLABORATOR | Invite by email later OK; owner can add partner |
| 4 | Dashboard | Countdown, progress, guests/RSVP, budget, tasks, website status |
| 5 | Wedding Website Builder (block-based) | Templates, theme tokens, sections toggle/reorder, content edit, preview, publish `/w/[slug]` |
| 6 | Public / private site | Private = noindex + access gate; never leak private guest PII |
| 7 | Guest list CRUD | Search/filter/sort; household; RSVP + meal fields |
| 8 | RSVP via token/link | No Edenida account; feeds guest + dashboard |
| 9 | Checklist | Default template by wedding date + custom tasks |
| 10 | Budget | Categories, planned/estimated/actual, payments summary |
| 11 | Vendors | Personal CRM (no marketplace) |

## 2. In scope (P1 — ship if capacity; required before “complete MVP” per mandate)

| # | Capability |
|---|---|
| 12 | Events + day-of timeline |
| 13 | Seating chart (tables, DnD, capacity warnings) |
| 14 | Notes + private files (Storage) |
| 15 | Inspiration boards |

## 3. Explicit out of scope (P2+)
Marketplace, advanced invitations, custom domain UI, advanced floor plan, AI recommendations, payments processing, native apps, guest photo social album, printable factories.

## 4. MVP exit journey (must all work)

1. Sign up
2. Create wedding
3. Configure wedding
4. Choose website template
5. Edit website
6. Publish website
7. Add guests
8. Share RSVP link
9. Guest submits RSVP
10. Couple sees RSVP
11. Checklist
12. Budget
13. Vendors
14. Assign guests to tables
15. Dashboard
16. Mobile usable
17. Logout / login / data persists
18. User A cannot access Wedding B

## 5. Weighted completion model (Overall %)

| Phase | Weight | Notes |
|---:|---:|---|
| 0 Research & product | 5% | Docs + plan |
| 1 Architecture | 5% | ADRs + data model |
| 2 Foundation | 12% | App, auth scaffold, CI, DS |
| 3 Wedding workspace | 8% | CRUD + members + dashboard shell |
| 4 Website builder | 20% | P0 differentiator |
| 5 Guests + RSVP | 15% | Critical guest loop |
| 6 Checklist + events + timeline | 8% | |
| 7 Budget + vendors | 8% | |
| 8 Seating | 7% | |
| 9 Notes/files/inspiration | 5% | |
| 10 QA + security hardening | 5% | |
| 11 Production readiness | 2% | |

Overall = Σ (phase_completion × weight). Never invent %.

## 6. Non-blocking defaults (locked for MVP)

- Public URL pattern: `edenida.com/w/{slug}` (site, `/rsvp`, `/rsvp/confirmation`)
- Authenticated management: `/app/weddings/{id}/…` where `{id}` is the wedding UUID (ADR-005)
- Future: `{slug}.edenida.com` and custom domains — reserved architecturally; they do not move member modules onto the public path
- Auth provider: email/password + magic link (Supabase); OAuth Google optional post-MVP
- Currency: CAD default, ISO code on wedding
- Timezone: wedding timezone setting
- Template set (6): Editorial, Modern, Romantic, Minimal, Garden, Luxury
