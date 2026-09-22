-- Fix infinite recursion: weddings DELETE policy queried wedding_members under RLS,
-- and wedding_members SELECT queried weddings under RLS.

create or replace function public.is_wedding_owner(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wedding_members m
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

revoke all on function public.is_wedding_owner(uuid) from public;
grant execute on function public.is_wedding_owner(uuid) to authenticated;

drop policy if exists "weddings_delete_owner" on public.weddings;
create policy "weddings_delete_owner"
  on public.weddings for delete to authenticated
  using (public.is_wedding_owner(id));

-- Avoid weddings table RLS from within wedding_members policies.
drop policy if exists "wedding_members_select_member" on public.wedding_members;
create policy "wedding_members_select_member"
  on public.wedding_members for select to authenticated
  using (
    public.is_wedding_member(wedding_id)
    or user_id = (select auth.uid())
  );

-- Creator bootstrap insert already checks weddings.created_by via RLS-safe creator path;
-- keep creator-owner insert but evaluate wedding ownership via security definer join.
drop policy if exists "wedding_members_insert_creator_owner" on public.wedding_members;

create or replace function public.is_wedding_creator(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.weddings w
    where w.id = p_wedding_id
      and w.created_by = (select auth.uid())
  );
$$;

revoke all on function public.is_wedding_creator(uuid) from public;
grant execute on function public.is_wedding_creator(uuid) to authenticated;

create policy "wedding_members_insert_creator_owner"
  on public.wedding_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and public.is_wedding_creator(wedding_id)
  );
