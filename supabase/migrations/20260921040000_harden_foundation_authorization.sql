-- EDE-DATA-001-R1: Harden foundation authorization
-- - private schema SECURITY DEFINER helpers (search_path = '')
-- - role-aware wedding UPDATE (viewer cannot write)
-- - column-level UPDATE grants (id/created_by/created_at immutable via grants)

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;
-- USAGE required so authenticated can resolve private.* in RLS; no table access in private
grant usage on schema private to authenticated;
-- anon: no schema USAGE → cannot invoke private helpers via SQL/API

---------------------------------------------------------------------------
-- Helpers in private (SECURITY DEFINER, locked search_path)
---------------------------------------------------------------------------

create or replace function private.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as m
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_wedding_owner(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as m
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'::public.wedding_member_role
  );
$$;

create or replace function private.is_wedding_creator(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.weddings as w
    where w.id = p_wedding_id
      and w.created_by = (select auth.uid())
  );
$$;

create or replace function private.can_edit_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members as m
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
      and m.role in (
        'owner'::public.wedding_member_role,
        'partner'::public.wedding_member_role,
        'collaborator'::public.wedding_member_role,
        'wedding_planner'::public.wedding_member_role
      )
  );
$$;

revoke all on function private.is_wedding_member(uuid) from public;
revoke all on function private.is_wedding_owner(uuid) from public;
revoke all on function private.is_wedding_creator(uuid) from public;
revoke all on function private.can_edit_wedding(uuid) from public;

grant execute on function private.is_wedding_member(uuid) to authenticated;
grant execute on function private.is_wedding_owner(uuid) to authenticated;
grant execute on function private.is_wedding_creator(uuid) to authenticated;
grant execute on function private.can_edit_wedding(uuid) to authenticated;

-- Explicitly deny anon
revoke execute on function private.is_wedding_member(uuid) from anon;
revoke execute on function private.is_wedding_owner(uuid) from anon;
revoke execute on function private.is_wedding_creator(uuid) from anon;
revoke execute on function private.can_edit_wedding(uuid) from anon;

---------------------------------------------------------------------------
-- handle_new_user → private
---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

---------------------------------------------------------------------------
-- Recreate RLS policies to use private.* helpers
---------------------------------------------------------------------------

drop policy if exists "weddings_select_member_or_creator" on public.weddings;
create policy "weddings_select_member_or_creator"
  on public.weddings for select to authenticated
  using (
    private.is_wedding_member(id)
    or created_by = (select auth.uid())
  );

drop policy if exists "weddings_update_member" on public.weddings;
create policy "weddings_update_editor"
  on public.weddings for update to authenticated
  using (private.can_edit_wedding(id))
  with check (private.can_edit_wedding(id));

drop policy if exists "weddings_delete_owner" on public.weddings;
create policy "weddings_delete_owner"
  on public.weddings for delete to authenticated
  using (private.is_wedding_owner(id));

drop policy if exists "wedding_members_select_member" on public.wedding_members;
create policy "wedding_members_select_member"
  on public.wedding_members for select to authenticated
  using (
    private.is_wedding_member(wedding_id)
    or user_id = (select auth.uid())
  );

drop policy if exists "wedding_members_insert_creator_owner" on public.wedding_members;
create policy "wedding_members_insert_creator_owner"
  on public.wedding_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'::public.wedding_member_role
    and private.is_wedding_creator(wedding_id)
  );

---------------------------------------------------------------------------
-- Column-level UPDATE grants: structural columns immutable via grants
---------------------------------------------------------------------------

revoke update on table public.weddings from authenticated;
grant update (title, wedding_date, timezone, currency, updated_at)
  on table public.weddings to authenticated;

revoke update on table public.profiles from authenticated;
grant update (full_name, avatar_url, locale, updated_at)
  on table public.profiles to authenticated;

---------------------------------------------------------------------------
-- Drop obsolete public SECURITY DEFINER helpers
---------------------------------------------------------------------------

drop function if exists public.is_wedding_member(uuid);
drop function if exists public.is_wedding_owner(uuid);
drop function if exists public.is_wedding_creator(uuid);
drop function if exists public.handle_new_user();
