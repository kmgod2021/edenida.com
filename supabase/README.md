# Supabase

Migrations live in `migrations/`.

When ready:

```bash
npx supabase login
npx supabase init   # if full local stack needed
npx supabase link --project-ref <ref>
npx supabase db push
```

Apply `migrations/20260920010000_foundation.sql` to the linked project before enabling live auth flows.
