# Edenida — User Journeys

Authenticated routes are `/app/weddings/[id]/…`. Public routes are `/w/[slug]/…`. Locked in ADR-005.

## UJ-01 Couple onboarding
1. Land on marketing home
2. Sign up
3. Create wedding at `/app/weddings/new` (working title, date optional, partner names)
4. Land on wedding dashboard `/app/weddings/[id]` (empty states, not dead ends)

**Acceptance:** authenticated user owns wedding; RLS membership row OWNER.

## UJ-02 Build & publish website
Editor: `/app/weddings/[id]/website`. Published site: `/w/{slug}`.

1. Open Website
2. Pick template (preview)
3. Edit hero text/photo, colors, fonts
4. Toggle/reorder sections
5. Preview desktop/mobile
6. Choose slug, publish
7. Open `/w/{slug}` as guest

**Acceptance:** content persists across template switch; unpublished not publicly readable (except preview for members).

## UJ-03 Guest RSVP (no account)
1. Receive invitation link with token
2. Open site RSVP section or `/w/{slug}/rsvp?t=…`
3. Confirm/decline; events; plus-one if allowed; meal; allergies; custom answers
4. See confirmation at `/w/{slug}/rsvp/confirmation`

**Acceptance:** updates guest RSVP status; couple dashboard updates; no full guest list exposure; token single-guest scoped.

## UJ-04 Guest list management
Routes: `/app/weddings/[id]/guests`, `…/guests/households`, and internal RSVP admin at `…/guests/rsvp`.

1. Add guest / household
2. Filter by RSVP/group/side
3. Edit meal/allergies/notes
4. Export (CSV) later; import structure ready

## UJ-05 Checklist progress
Route: `/app/weddings/[id]/planning`.

1. Seed default tasks from wedding date
2. Complete / assign / due dates
3. Dashboard shows X/Y and overdue

## UJ-06 Budget control
Route: `/app/weddings/[id]/budget`.

1. Set total budget
2. Add categories/items with planned vs actual + payments
3. See remaining / over-under

## UJ-07 Vendors CRM
Route: `/app/weddings/[id]/vendors`.

1. Add photographer etc.
2. Attach notes/price/status
3. Link optional budget item

## UJ-08 Seating
1. Create tables with capacity
2. Drag unassigned guests onto tables
3. Warn on overflow
4. Autosave

## UJ-09 Collaboration
Settings: `/app/weddings/[id]/settings`.

1. Owner invites partner/collaborator
2. Partner can edit; collaborator scoped per policies
3. Non-member denied

## UJ-10 Security isolation
User A never reads/writes User B wedding resources (horizontal privilege escalation tests).
