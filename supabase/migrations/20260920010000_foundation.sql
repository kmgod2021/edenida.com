-- Edenida foundation schema (Phase 2)
-- Profiles + weddings + membership with RLS enabled from day one.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  wedding_date date,
  timezone text not null default 'America/Toronto',
  currency char(3) not null default 'CAD',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.wedding_member_role as enum (
  'owner',
  'partner',
  'collaborator',
  'wedding_planner',
  'viewer'
);

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.wedding_member_role not null,
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id)
);

create index wedding_members_user_id_idx on public.wedding_members (user_id);
create index weddings_created_by_idx on public.weddings (created_by);

create or replace function public.is_wedding_member(p_wedding_id uuid)
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
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "weddings_select_member"
  on public.weddings for select to authenticated
  using (public.is_wedding_member(id));

create policy "weddings_insert_authenticated"
  on public.weddings for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "weddings_update_member"
  on public.weddings for update to authenticated
  using (public.is_wedding_member(id))
  with check (public.is_wedding_member(id));

create policy "wedding_members_select_member"
  on public.wedding_members for select to authenticated
  using (public.is_wedding_member(wedding_id));

create policy "wedding_members_insert_self_owner"
  on public.wedding_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
  );
