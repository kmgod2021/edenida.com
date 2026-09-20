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
weddings 1──* households 1──* guests
guests 1──* invitations
guests 1──* rsvps (per event or one primary + event answers)
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

### wedding_settings
dashboard prefs, checklist template version, etc.

### households
`wedding_id`, `name`, `address?`

### guests
names, email, phone, household_id, group_label, side, is_child, plus_one_allowed, invitation_status, rsvp_status, meal_choice, allergies, dietary, private_notes, table assignment via seat_assignments

### invitations
`guest_id`, `token_hash`, `expires_at`, `revoked_at`
Store **hash** of token; send raw token once.

### events / rsvp_responses
events belonging to wedding; RSVP answers per guest×event

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
- `guests(wedding_id, last_name, first_name)`
- `invitations(token_hash)` unique
- `tasks(wedding_id, due_at)`, `(wedding_id, status)`

## RLS strategy (summary)
See `SECURITY.md`. Pattern:

```sql
create policy "members select"
on guests for select to authenticated
using (is_wedding_member(wedding_id));
```

Public site: narrow `anon` SELECT on published non-sensitive site fields only — **never** guests PII.
RSVP writes via authenticated-as-anon RPC with token proof.

## Migrations
`supabase/migrations/` sequential. Never edit applied migration in place on shared envs.
