-- Role-aware RLS matrix + created_by immutability + forged membership + anon.
begin;
create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','a1111111-1111-1111-1111-111111111111','authenticated','authenticated','owner@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Owner"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','a2222222-2222-2222-2222-222222222222','authenticated','authenticated','partner@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Partner"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','a3333333-3333-3333-3333-333333333333','authenticated','authenticated','collab@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Collab"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','a4444444-4444-4444-4444-444444444444','authenticated','authenticated','planner@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Planner"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','a5555555-5555-5555-5555-555555555555','authenticated','authenticated','viewer@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Viewer"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','a6666666-6666-6666-6666-666666666666','authenticated','authenticated','outsider@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Outsider"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1111111-1111-1111-1111-111111111111','authenticated','authenticated','owner-b@edenida.test','x',now(),'{}'::jsonb,'{"full_name":"Owner B"}'::jsonb,now(),now());

select ok(exists (select 1 from public.profiles where id = 'a1111111-1111-1111-1111-111111111111'::uuid), 'owner profile');
select ok(exists (select 1 from public.profiles where id = 'a5555555-5555-5555-5555-555555555555'::uuid), 'viewer profile');

set local role postgres;

insert into public.weddings (id, title, created_by) values
  ('w1111111-1111-1111-1111-111111111111', 'Wedding A', 'a1111111-1111-1111-1111-111111111111'),
  ('w2222222-2222-2222-2222-222222222222', 'Wedding B', 'b1111111-1111-1111-1111-111111111111'),
  ('w3333333-3333-3333-3333-333333333333', 'Disposable', 'a1111111-1111-1111-1111-111111111111');

insert into public.wedding_members (wedding_id, user_id, role) values
  ('w1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'owner'),
  ('w1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'partner'),
  ('w1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'collaborator'),
  ('w1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'wedding_planner'),
  ('w1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'viewer'),
  ('w2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'owner'),
  ('w3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'owner');

select ok(
  not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('is_wedding_member','is_wedding_owner','is_wedding_creator','can_edit_wedding','handle_new_user')
  ),
  'public SECURITY DEFINER wedding helpers removed'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'can_edit_wedding'
  ),
  'private.can_edit_wedding exists'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select private.can_edit_wedding('w1111111-1111-1111-1111-111111111111'::uuid) $$, '42501');
select throws_ok($$ select count(*) from public.weddings $$, '42501');

-- OWNER
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'owner SELECT');
update public.weddings set title = 'Owner Edit', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Owner Edit', 'owner UPDATE');
select throws_ok(
  $$ update public.weddings set created_by = 'a6666666-6666-6666-6666-666666666666'::uuid where id = 'w1111111-1111-1111-1111-111111111111'::uuid $$,
  '42501'
);
set local role postgres;
select is(
  (select created_by::text from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid),
  'a1111111-1111-1111-1111-111111111111',
  'created_by unchanged after owner attempt'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
delete from public.weddings where id = 'w3333333-3333-3333-3333-333333333333'::uuid;
select is((select count(*)::int from public.weddings where id = 'w3333333-3333-3333-3333-333333333333'::uuid), 0, 'owner DELETE');

-- PARTNER
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'partner SELECT');
update public.weddings set title = 'Partner Edit', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Partner Edit', 'partner UPDATE');
delete from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'partner DELETE denied');

-- COLLABORATOR
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'collaborator SELECT');
update public.weddings set title = 'Collab Edit', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Collab Edit', 'collaborator UPDATE');
delete from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'collaborator DELETE denied');

-- WEDDING_PLANNER
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'planner SELECT');
update public.weddings set title = 'Planner Edit', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Planner Edit', 'planner UPDATE');
delete from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'planner DELETE denied');

-- VIEWER
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'viewer SELECT');
update public.weddings set title = 'Viewer Hack', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Planner Edit', 'viewer UPDATE denied');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a5555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
delete from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'viewer DELETE denied');

-- NON-MEMBER
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a6666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 0, 'non-member SELECT denied');
update public.weddings set title = 'Outsider', updated_at = now() where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select title from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 'Planner Edit', 'non-member UPDATE denied');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a6666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
delete from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid;
set local role postgres;
select is((select count(*)::int from public.weddings where id = 'w1111111-1111-1111-1111-111111111111'::uuid), 1, 'non-member DELETE denied');

-- Cross-wedding + forged membership
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((select count(*)::int from public.weddings where id = 'w2222222-2222-2222-2222-222222222222'::uuid), 0, 'owner A cannot SELECT wedding B');
select throws_ok(
  $$ insert into public.wedding_members (wedding_id, user_id, role)
     values ('w2222222-2222-2222-2222-222222222222'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, 'owner') $$,
  '42501'
);

-- Editor (partner) cannot change created_by
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$ update public.weddings set created_by = 'a2222222-2222-2222-2222-222222222222'::uuid where id = 'w1111111-1111-1111-1111-111111111111'::uuid $$,
  '42501'
);

select * from finish();
rollback;
