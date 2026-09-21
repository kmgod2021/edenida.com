# Wedding workspace — Wave B persistence handoff

**Status of Wave A (`EDE-WORKSPACE-001`):** `READY_FOR_DATA_INTEGRATION`  
**Next task:** `EDE-WORKSPACE-002`  
**Do not treat Wave A as DONE.** Fixtures are intentional. There is no feature migration in this branch.

## What Wave A owns

UI, domain types, validation, and an in-memory repository stored in the httpOnly cookie `edenida_workspace`. Routes live under `src/app/app/**` because Phase 2 placed the authenticated shell at `src/app/app`, and this task must not move the root layout.

| Surface | Route |
|---|---|
| Onboarding or picker | `/app` |
| Create wedding | `/app/weddings/new` |
| Dashboard | `/app/w/[weddingId]` |
| Settings | `/app/w/[weddingId]/settings` |
| Module empty states | `/website`, `/guests`, `/checklist`, `/budget`, `/vendors` |

`docs/ARCHITECTURE.md` shows a future `(app)/w/[weddingId]` group. The domain does not depend on that path. A later layout move can keep these hrefs or redirect them.

Phase 8/9 (seating, notes, files, inspiration) are not in the shell.

## Domain API

Exported from `src/features/workspace/index.ts`:

- `Wedding` — columns of `public.weddings`
- `WeddingMember` — columns of `public.wedding_members`, role enum `owner | partner | collaborator | wedding_planner | viewer`
- `CurrentWedding` — viewer membership, all member rows, profile names, optional `partnerDisplayName`
- `WeddingSummary` — dashboard read model (countdown + progress + module counts)
- `WeddingContext` — `{ viewerUserId, current, summary }` for the open workspace

`WeddingRepository` / `WeddingWorkspaceService` are the only write ports the UI uses.

## Membership rule

Creating a wedding inserts **one** `wedding_members` row: the viewer as `owner`.

`partnerDisplayName` is **not** a member. The foundation table requires `user_id`. Wave A keeps the name on the fixture read model and says so in the UI (“pas encore membre”).

Wave B options, in order:

1. Show the partner from a real `wedding_members` row (`role = partner`) joined to `profiles.full_name` once that user exists.
2. If the product still wants a name before an account exists, add it on `wedding_settings` (table described in `docs/DATABASE.md`, not created yet). That needs its own migration in the data track — not a second members table.

Do not insert a partner row with a fake user id.

## Swap point

`src/features/workspace/server/get-workspace-service.ts`

Wave A always builds `createMemoryWeddingRepository` and passes `FIXTURE_VIEWER_USER_ID`.

Wave B should:

1. Resolve the viewer with the Supabase server client (`auth.getUser()`). No service role. No change to `src/proxy.ts` unless an auth task owns it.
2. Implement `WeddingRepository` against `weddings` and `wedding_members` using the existing RLS:
   - select wedding / members when `is_wedding_member`
   - insert wedding when `created_by = auth.uid()`
   - insert member only as self + `owner` (current policy)
   - update wedding when the caller is a member (current policy)
3. Return `null` for non-members (do not distinguish forbidden from missing).
4. Delete the `edenida_workspace` cookie when the Supabase repository is active.
5. Remove `loadExampleWorkspaceAction` and the “Explorer un exemple” button, or gate them to a non-production fixture flag. They must not write demo guests into a real tenant.

`ModuleSignals` on `WeddingSummary` are zeros for a wedding created in Wave A. The example fixture is the only non-zero snapshot. Until guests, tasks, budget, and sites exist, the Supabase summary should keep returning empty signals rather than inventing counts. Fill each field from its own table when that phase lands:

| Field | Later source |
|---|---|
| `websiteStatus` | `wedding_sites.status` |
| `guestCount` / `rsvpCount` | `guests` |
| `tasksCompleted` / `tasksTotal` | `tasks` |
| `budgetPlannedCents` / `budgetSpentCents` | budget items and payments |

Progress math stays in `buildProgress` so the dashboard does not drift.

## Authorization already assumed

The memory repository filters by membership the same way RLS does today. A user who is not a member cannot list, read, or update that wedding. Tests cover this in `memory-repository.test.ts`.

`profileNames` is a join of `profiles.full_name`, not a column on `wedding_members`.

## Dependency request

None. Wave A did not change `package.json` or `pnpm-lock.yaml`. Component tests render with `react-dom/server` so no Testing Library / jsdom package was added.

## Explicitly out of this branch

Migrations, RLS edits, Auth foundation, `src/proxy.ts`, root layout, `globals.css`, design tokens, Phase 8/9, merge to `main`.
