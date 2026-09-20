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

## Database tests

Official path (Docker required):

```bash
npx supabase db start
npx supabase test db
```

Fallback when Docker is unavailable (uses `.tmp-db-url` or `DATABASE_URL`):

```bash
pnpm test:db
```

## Auth notes (DEVELOPMENT)

- Publishable key model: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
- Do **not** put `SUPABASE_SECRET_KEY` in the Next.js client
- Email confirmation is **ON** in the current DEVELOPMENT project
- E2E uses a local DB helper (`scripts/dev-auth-helpers.mjs`) to confirm test users
- Recommended: keep confirmation ON for staging/production; optionally disable only on a dedicated local/dev Auth setting if preferred

## CI

`.github/workflows/db-tests.yml` runs `supabase db start` + `supabase test db` without remote secrets.
