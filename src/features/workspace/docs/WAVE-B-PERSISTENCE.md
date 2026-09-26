# Wedding workspace — persistence

**Status:** `EDE-WORKSPACE-002` implemented on PR #3. **Not merged.** Phase 3 stays open.
**Runtime source of truth:** the signed-in user's Supabase session, `public.weddings`, and `public.wedding_members`.

## Completed

- Viewer id comes from `supabase.auth.getUser()`. `FIXTURE_VIEWER_USER_ID` stays in the memory repository used by unit tests only.
- `/app` requires a session and redirects to `/login` when there is none.
- `SupabaseWeddingRepository` implements `WeddingRepository`. UI code still calls `WeddingWorkspaceService`.
- `listWeddings` / `getCurrent` / `getSummary` use the caller's RLS. A non-member gets the same not-found state as a missing wedding.
- `create_wedding_with_owner` (security invoker) inserts the wedding and the owner membership atomically. `created_by` and `wedding_members.user_id` are `auth.uid()`. The function takes no user id.
- Wedding updates write only `title`, `wedding_date`, `timezone`, `currency`, and `updated_at`. A visible wedding the caller cannot edit returns a safe authorization error.
- Summaries use `emptyModuleSignals()`. Website, guests, planning, and budget stay empty until those tables exist. Progress stays in `buildProgress`.
- The `edenida_workspace` cookie is cleared and is not read. `loadExampleWorkspaceAction` and “Explorer un exemple” are removed.
- Profiles stay select-own. Other members render as “Membre”.
- No service-role key.

## Routes

Unchanged from ADR-005: `/app/weddings/[id]` with website, guests, planning, budget, vendors, and settings. Public pages stay at `/w/[slug]`.

## Not done here

| Item | Why it waits |
|---|---|
| Partner display name | `wedding_settings` is not created. The form explains the name is not saved. Do not insert a fake partner user. |
| Invitations | No membership administration for partner, collaborator, wedding_planner, or viewer. |
| Module counts | No guests, tasks, budget, or site rows to query. |
| Phase 3 DONE | PR #3 is still a draft. |

## Swap point

`src/features/workspace/server/get-workspace-service.ts` builds `createSupabaseWeddingRepository` for `requireWorkspaceUser().id`.

If Supabase is not configured, the server client throws. The app does not fall back to the memory repository.
