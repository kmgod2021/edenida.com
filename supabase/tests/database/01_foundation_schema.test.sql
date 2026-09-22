-- Schema presence + RLS enabled for Edenida foundation.
begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'weddings', 'weddings exists');
select has_table('public', 'wedding_members', 'wedding_members exists');

select has_column('public', 'profiles', 'id', 'profiles.id');
select has_column('public', 'weddings', 'created_by', 'weddings.created_by');
select has_column('public', 'wedding_members', 'role', 'wedding_members.role');

select has_pk('public', 'profiles', 'profiles has pk');
select has_pk('public', 'weddings', 'weddings has pk');
select has_pk('public', 'wedding_members', 'wedding_members has pk');

select has_index('public', 'wedding_members', 'wedding_members_user_id_idx', 'members user_id index');
select has_index('public', 'weddings', 'weddings_created_by_idx', 'weddings created_by index');

select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'profiles'),
  'RLS enabled on profiles'
);
select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'weddings'),
  'RLS enabled on weddings'
);
select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'wedding_members'),
  'RLS enabled on wedding_members'
);

select has_function('private', 'is_wedding_member', array['uuid'], 'private.is_wedding_member exists');
select has_function('private', 'can_edit_wedding', array['uuid'], 'private.can_edit_wedding exists');

select isnt_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and tablename = 'weddings' $$,
  'weddings has policies'
);
select isnt_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and tablename = 'wedding_members' $$,
  'wedding_members has policies'
);
select isnt_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' $$,
  'profiles has policies'
);

select * from finish();
rollback;
