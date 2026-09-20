# EDE-DATA-001 migration notes

## Changes vs original Phase 2 draft

Before first remote apply, foundation migration was hardened:

1. `weddings` SELECT allows creator **or** member (bootstrap before membership row)
2. Explicit `REVOKE`/`GRANT` for `anon` vs `authenticated`
3. Forged membership blocked: owner insert only if `is_wedding_creator`
4. Follow-up migration `20260920180000_fix_rls_recursion.sql` after remote apply:
   - `is_wedding_owner` / `is_wedding_creator` SECURITY DEFINER helpers
   - Removes RLS recursion between `weddings` DELETE and `wedding_members` SELECT

## Auth environments

| Env | Email confirmation | Notes |
|---|---|---|
| development | ON (current) | E2E uses DB seed helper for confirmed users |
| staging | ON recommended | |
| production | ON required | |
