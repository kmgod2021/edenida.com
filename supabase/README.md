# Supabase

## Migrations

```bash
# Prefer linked project after `npx supabase login` + `npx supabase link`
# On this machine, DEVELOPMENT was applied via pooler db URL (us-west-2).

npx supabase@2.117.0 db push --db-url "$DATABASE_URL" --dry-run
npx supabase@2.117.0 db push --db-url "$DATABASE_URL"
```

Migrations:

1. `20260920010000_foundation.sql` — profiles / weddings / wedding_members + RLS
2. `20260920180000_fix_rls_recursion.sql` — owner/creator SECURITY DEFINER helpers
3. `20260921040000_harden_foundation_authorization.sql` — private helpers, role-aware UPDATE, column grants

## Database tests

Official CLI (Docker required):

```bash
npx supabase db start
pnpm test:db
# equivalent: npx supabase test db
```

Failed pgTAP assertions exit non-zero via the CLI.

## Auth notes

- Publishable key model: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
- Do **not** put `SUPABASE_SECRET_KEY` in the Next.js client or browser bundle
- Local Auth (`supabase/config.toml`): `enable_confirmations = false` so Playwright can run real signup → session without a mailbox
- E2E uses the Auth API through the signup/login UI only — no direct writes to `auth.users` / `auth.identities`
- Cloud DEVELOPMENT may keep email confirmation ON; use local Supabase for reproducible Auth E2E

## Authorization helpers

Helpers live in `private` (not exposed via the Data API):

- `private.is_wedding_member`
- `private.is_wedding_owner`
- `private.is_wedding_creator`
- `private.can_edit_wedding` — owner / partner / collaborator / wedding_planner (not viewer)
- `private.handle_new_user` — Auth trigger

Wedding UPDATE is column-scoped: `title`, `wedding_date`, `timezone`, `currency`, `updated_at` only (`id` / `created_by` / `created_at` not updatable via client grants).

## CI

`.github/workflows/db-tests.yml` runs `supabase db start` + `supabase test db` without remote secrets.
