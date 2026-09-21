# Guests + RSVP — persistence handoff

**Status:** READY_FOR_DATA_INTEGRATION
**Track:** 5, Wave A
**Owner of the next slice:** Supabase / security, after the token proposal is reviewed

The UI, domain types, and `GuestRepository` port are in place. Screens talk to `getGuestRepository()` (`src/features/guests/data/get-repository.ts`), which today returns an in-memory fixture store. Swap that factory for a server-only Supabase implementation of the same interface. Do not call Supabase from client components.

## Route seam

Member UI (this wave):

- `/app/weddings/[weddingId]/guests`
- `/app/weddings/[weddingId]/guests/new`
- `/app/weddings/[weddingId]/guests/[guestId]`
- `/app/weddings/[weddingId]/households`
- `/app/weddings/[weddingId]/rsvp`

Public UI:

- `/w/[slug]/rsvp?t=…`
- `/w/[slug]/rsvp/confirmation?t=…`

`docs/ARCHITECTURE.md` sketches member routes as `/(app)/w/[weddingId]`. That URL collides with the public site already mounted at `src/app/w/[slug]`. This wave uses `/app/weddings/[weddingId]` so both can exist. Coordinator can rename later; keep the repository keyed by wedding id, not by the path.

## Test-only query params

`session` and `scenario` (`demo` | `empty` | `error`) exist so Playwright can isolate the mock and render empty/error states. **The Supabase repository must ignore them.** Authorization is the signed-in member's wedding role. Public reads and writes are authorized by the reviewed token design, not by these params.

## Port

`GuestRepository` in `src/features/guests/data/repository.ts`:

| Method | Member / public | Notes |
|---|---|---|
| `getWedding` | member | Events are a read model. The events track owns event rows. |
| `listGuests` | member | List DTO omits private notes. |
| `getGuest` | member | Includes private notes and invitation **status**, never a raw token or hash. |
| `saveGuest` | member | Creates or updates. Validates household and event ids. |
| `deleteGuest` | member | Cascades that guest's invitations and RSVPs in the mock. |
| `listHouseholds` / `saveHousehold` | member | Household delete is not in Wave A. |
| `getRsvpDashboard` | member | Pure summary in `buildRsvpDashboard`. |
| `getPublicRsvp` | public | Single guest. One error message for every bad link. |
| `submitPublicRsvp` | public | Server enforces plus-one and event scope. |
| `getRsvpConfirmation` | public | Same token, same guest, no other names. |

## Domain to columns (not a migration)

Supabase owns DDL. This is the mapping the repository should satisfy. Do not add these tables from this branch.

### households

`id`, `wedding_id`, `name`, `address null`

### guests

`id`, `wedding_id`, `household_id null`, `first_name`, `last_name`, `email null`, `phone null`, `group_label null`, `side`, `is_child`, `plus_one_allowed`, `plus_one_name null`, `plus_one_guest_id null`, `invitation_status`, `rsvp_status`, `meal_choice`, `dietary text[]` (or a child table), `dietary_note null`, `allergies null`, `private_notes null`, `updated_at`

Event invitations: `guest_events(guest_id, event_id)` rather than an array, if the events table is the source of truth. The domain field is `eventIds`.

### invitations

`id`, `wedding_id`, `guest_id`, `token_hash`, `expires_at null`, `revoked_at null`, `created_at`

No raw token column. Hash algorithm is **not** chosen; see `rsvp-token-security-proposal.md`.

### rsvps

`id`, `wedding_id`, `guest_id` unique, `invitation_id null`, `status`, `source` (`guest` | `couple`), `plus_one_attending`, `plus_one_name null`, `plus_one_meal_choice`, `meal_choice`, `dietary`, `dietary_note null`, `allergies null`, `message null`, `submitted_at null`

### rsvp_answers (`RSVPAnswer`)

`id`, `rsvp_id`, `event_id`, `attending`

Meal stays on the RSVP, not on each answer. One answer per invited event.

## Write rules already implemented in the mock

- Couple save updates the guest row. A RSVP row is created when status is attending or declined. Pending with no prior RSVP does not invent a submission.
- Re-saving a guest does not rewrite per-event answers unless the RSVP status itself changed.
- Public decline updates `rsvp_status` and the message, and does **not** wipe the couple's meal, dietary, or allergy fields on the guest.
- Public accept writes meal, dietary, allergies, and (if allowed) the plus-one name back onto the guest so the list matches the answer.
- A declined public answer clears plus-one attendance and does not keep a meal on that RSVP.
- `plus_one_guest_id` stays null. Wave A does not create a second guest for a plus-one. Whether a named plus-one becomes a guest (needed later for seating) is a product decision; seating is out of scope here.

## Security constraints for the real repository

- RLS on every new table. Anon must not `SELECT` guests. See `docs/SECURITY.md` and `docs/DATABASE.md`.
- Public submit goes through a server action or RPC that proves the token. No service role in the browser.
- Do not return other guests, emails, phones, private notes, or token hashes from public methods.
- Replace the mock hasher only after the proposal is accepted.

## Dependency request

None. No `package.json` change.

If a later wave wants browser component tests beyond `renderToStaticMarkup`, request devDependencies `@testing-library/react` and `jsdom`. Not required for this slice.

`vitest.config.ts` now also picks up `src/**/*.test.tsx` so the markup tests run. That is the only tooling edit outside the feature folder, plus the thin App Router pages that render it.

## Suggested verification once data exists

- Member CRUD against a real wedding id, with a second user denied
- Anon `SELECT` on `guests` denied
- Invalid token rejected with the uniform message
- Submitting as Léa changes the dashboard counts the couple sees
- Public response body still has no other guest and no private note
