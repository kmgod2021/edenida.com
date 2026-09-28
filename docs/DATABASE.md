# Edenida — Database Design

## Principles
- Wedding is the tenant root
- Prefer relational columns for anything filtered/sorted/joined
- JSONB only for presentation tokens and section content props
- RLS on every exposed table; revoke overly broad grants
- Index foreign keys and policy filter columns

## ERD (logical)

```
profiles 1──* wedding_members *──1 weddings
weddings 1──1 wedding_settings
weddings 1──1 wedding_sites 1──* site_sections
weddings 1──* households 1──0..* guests
guests 1──* invitations 1──* rsvp_sessions
guests 1──0..1 rsvps 1──* rsvp_answers *──1 events
guests *──* events via guest_events
weddings 1──* events
weddings 1──* tasks
weddings 1──* budget_categories 1──* budget_items 1──* payments
weddings 1──* vendors
weddings 1──1 seating_plans 1──* seating_tables
guests 1──0..1 seat_assignments *──1 seating_tables
weddings 1──* notes
weddings 1──* assets
weddings 1──* inspiration_items
weddings 1──* timeline_items
weddings 1──* activity_log
```

## Core tables (initial)

### profiles
`id uuid PK = auth.users.id`, `full_name`, `avatar_url`, `locale`, `created_at`

### weddings
`id`, `title`, `wedding_date`, `timezone`, `currency`, `cover_asset_id?`, `created_by`, timestamps

### wedding_members
`wedding_id`, `user_id`, `role` ∈ `owner|partner|collaborator|wedding_planner|viewer`, unique(wedding_id,user_id)

Creating a wedding is `public.create_wedding_with_owner(title, wedding_date, timezone, currency)` (security invoker). It inserts the wedding with `created_by = auth.uid()` and exactly one `owner` membership for that same user, in one transaction. It does not accept a user id.

### wedding_settings
dashboard prefs, checklist template version, etc.

### households
`id`, `wedding_id`, `name`, `address?`, timestamps.
Name is required and trimmed. A guest may omit `household_id`. Deleting a household sets that column null and does not delete guests.

### guests
`id`, `wedding_id`, `household_id?`, `first_name`, `last_name`, `email?`, `phone?`, `group_label?`, `side` (`partner_a|partner_b|both|unspecified`), `is_child`, `plus_one_allowed`, `invitation_status` (`not_invited|save_the_date|invited`), `private_notes?`, timestamps.

Couple-controlled planning stays here. Current RSVP state is not copied onto the guest: status, meals, dietary, allergies, plus-one name, and plus-one attendance are columns on `rsvps`. There is no `plus_one_guest_id`. Seat assignment remains a later table.

### events
Minimum event identity for invitations and RSVP answers: `id`, `wedding_id`, `name`, `starts_at?`, timestamps. Timeline, venue, and schedule fields are later migrations.

### guest_events
`id`, `wedding_id`, `guest_id`, `event_id`, `created_at`. Unique `(guest_id, event_id)`. Guest and event must belong to that same wedding.

### invitations
ADR-006 is the credential model. Implemented columns: `id`, `wedding_id`, `guest_id`, `token_hash` (32-byte `bytea`, unique), `pepper_id`, `issued_at`, `expires_at`, `revoked_at`, `revoked_reason` (`regenerated|couple|guest_deleted|pepper_rotation`), `last_used_at`, `created_by?`, `replaced_by_invitation_id?`, `created_at`.

No raw token column. At most one row per guest has `revoked_at` null. `replaced_by_invitation_id` must be another invitation for the same guest and wedding. `anon` and `authenticated` have no table privileges. Issuance RPCs are not in this migration.

### rsvp_sessions
`id`, `invitation_id`, `session_hash` (32-byte `bytea`, unique), `expires_at`, `revoked_at`, `created_at`, `last_seen_at`. No raw session secret. Revoking or deleting the invitation ends active sessions. Direct API privileges match `invitations`: none for `anon` or `authenticated`.

### rsvps / rsvp_answers
One current RSVP per guest: `rsvps` is unique on `(wedding_id, guest_id)`. Columns: `id`, `wedding_id`, `guest_id`, `invitation_id?`, `status` (`pending|attending|declined`), `source` (`guest|couple`), `plus_one_attending`, `plus_one_name?`, `plus_one_meal_choice`, `meal_choice` (`unset|meat|fish|vegetarian|vegan|child`), `dietary` (`dietary_restriction[]`: `vegetarian|vegan|gluten_free|lactose_free|halal|kosher|other`), `dietary_note?`, `allergies?`, `message?`, `submitted_at?`, timestamps.

`rsvp_answers`: `id`, `wedding_id`, `rsvp_id`, `event_id`, `attending`, timestamps. Unique `(rsvp_id, event_id)`. The RSVP, the event, and a non-null invitation must all be the same wedding; a non-null invitation must also be that guest's.

### tasks / task_categories
status, priority, due_at, assignee_member_id, notes

### timeline_items
day-of: time, activity, location, owner, notes, sort

### budget_categories / budget_items / payments
planned, estimated, actual, vendor_id?, due dates

### vendors
category enum, contact fields, status, pricing fields

### wedding_sites
`slug`, `status`, `is_private`, `template_id`, `theme jsonb`, `published_at`

### site_sections
`type`, `enabled`, `sort_order`, `content jsonb`

### seating_plans / seating_tables / seat_assignments
capacity checks in app + optional DB check constraint capacity ≥ count

### notes / assets / inspiration_items / activity_log
as named

## Indexes (minimum)
- `wedding_members(user_id)`, `(wedding_id,user_id)`
- all `wedding_id` FKs
- `wedding_sites(slug)` unique
- `guests(wedding_id, last_name, first_name)`, `guests(household_id)`
- `households(wedding_id)`, `events(wedding_id, starts_at)`
- `guest_events(wedding_id, guest_id)`, `guest_events(wedding_id, event_id)`
- `invitations(token_hash)` unique, `invitations(wedding_id, guest_id)`, partial unique one active invitation per guest
- `rsvp_sessions(session_hash)` unique
- `rsvps(wedding_id, guest_id)` unique
- `rsvp_answers(wedding_id, rsvp_id)`, `rsvp_answers(wedding_id, event_id)`
- `tasks(wedding_id, due_at)`, `(wedding_id, status)`

## RLS strategy (summary)
See `SECURITY.md`. Pattern:

```sql
create policy "members select"
on guests for select to authenticated
using (private.is_wedding_member(wedding_id));
```

Public site: narrow `anon` SELECT on published non-sensitive site fields only — **never** guests PII.
RSVP writes go through the ADR-006 RPCs `exchange_rsvp_session`, `read_rsvp`, and `submit_rsvp` once those functions exist. The guests relational migration does not create them. `anon` has no direct privileges on guest, invitation, session, or RSVP tables. `authenticated` has no direct privileges on `invitations` or `rsvp_sessions`.

## Migrations
`supabase/migrations/` sequential. Never edit applied migration in place on shared envs.
