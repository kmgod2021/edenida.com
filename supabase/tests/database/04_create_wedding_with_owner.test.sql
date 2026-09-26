-- Atomic wedding bootstrap: auth.uid() owner, anon denied, no partial row.
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

select ok(
  exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_wedding_with_owner'
      and p.pronargs = 4
      and p.prosecdef = false
  ),
  'create_wedding_with_owner is a 4-arg security invoker'
);

select is(
  (
    select p.proconfig
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'create_wedding_with_owner'
  ),
  array['search_path=""']::text[],
  'search_path is empty'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_wedding_with_owner(text,date,text,text)',
    'execute'
  ),
  'authenticated can execute'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_wedding_with_owner(text,date,text,text)',
    'execute'
  ),
  'anon cannot execute'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'd1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'creator@edenida.test',
    'x',
    now(),
    '{}'::jsonb,
    '{"full_name":"Creator"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'other@edenida.test',
    'x',
    now(),
    '{}'::jsonb,
    '{"full_name":"Other"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd3333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'viewer-ws@edenida.test',
    'x',
    now(),
    '{}'::jsonb,
    '{"full_name":"Viewer"}'::jsonb,
    now(),
    now()
  );

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$ select public.create_wedding_with_owner('Anon Wedding', null, 'America/Toronto', 'CAD') $$,
  '42501',
  null,
  'anonymous execute denied'
);
set local role postgres;
select is(
  (select count(*)::int from public.weddings where title = 'Anon Wedding'),
  0,
  'anonymous call leaves no wedding'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

create temp table created_wedding (id uuid);
insert into created_wedding (id)
select public.create_wedding_with_owner(
  'Persisted Wedding',
  '2027-06-12',
  'America/Toronto',
  'CAD'
);

select is(
  (select created_by::text from public.weddings where id = (select id from created_wedding)),
  'd1111111-1111-1111-1111-111111111111',
  'created_by = auth.uid()'
);
select is(
  (select count(*)::int from public.wedding_members where wedding_id = (select id from created_wedding)),
  1,
  'exactly one membership'
);
select is(
  (select role::text from public.wedding_members where wedding_id = (select id from created_wedding)),
  'owner',
  'membership role is owner'
);
select is(
  (select user_id::text from public.wedding_members where wedding_id = (select id from created_wedding)),
  'd1111111-1111-1111-1111-111111111111',
  'owner membership user = creator'
);
select is(
  (select wedding_date::text from public.weddings where id = (select id from created_wedding)),
  '2027-06-12',
  'wedding date is stored'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);
select throws_ok(
  $$ insert into public.wedding_members (wedding_id, user_id, role)
     values (
       (select id from created_wedding),
       'd2222222-2222-2222-2222-222222222222'::uuid,
       'owner'
     ) $$,
  '42501',
  null,
  'cannot create owner membership on someone else''s wedding'
);

create temp table created_by_other (id uuid);
insert into created_by_other (id)
select public.create_wedding_with_owner('Other Wedding', null, 'Europe/Paris', 'EUR');

select is(
  (select created_by::text from public.weddings where id = (select id from created_by_other)),
  'd2222222-2222-2222-2222-222222222222',
  'second caller is created_by of their own wedding'
);
select is(
  (select user_id::text from public.wedding_members where wedding_id = (select id from created_by_other)),
  'd2222222-2222-2222-2222-222222222222',
  'function cannot assign ownership to another user'
);
select is(
  (
    select count(*)::int
    from public.wedding_members
    where wedding_id = (select id from created_wedding)
      and user_id = 'd2222222-2222-2222-2222-222222222222'::uuid
  ),
  0,
  'other user is not a member of the first wedding'
);

set local role postgres;
insert into public.wedding_members (wedding_id, user_id, role)
values (
  (select id from created_wedding),
  'd3333333-3333-3333-3333-333333333333',
  'viewer'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);
select is(
  (select count(*)::int from public.weddings where id = (select id from created_wedding)),
  1,
  'viewer can still select'
);
select is(
  (
    select count(*)::int
    from public.wedding_members
    where wedding_id = (select id from created_wedding)
      and role = 'owner'
  ),
  1,
  'viewer row does not add a second owner'
);
update public.weddings
set title = 'Viewer Hack', updated_at = now()
where id = (select id from created_wedding);
set local role postgres;
select is(
  (select title from public.weddings where id = (select id from created_wedding)),
  'Persisted Wedding',
  'viewer update still denied'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
update public.weddings
set title = 'Owner Edit', updated_at = now()
where id = (select id from created_wedding);
select is(
  (select title from public.weddings where id = (select id from created_wedding)),
  'Owner Edit',
  'owner update still allowed'
);
delete from public.weddings where id = (select id from created_by_other);
set local role postgres;
select is(
  (select count(*)::int from public.weddings where id = (select id from created_by_other)),
  1,
  'non-owner delete still denied'
);

set local role postgres;
create or replace function public.edenida_test_block_member()
returns trigger
language plpgsql
as $$
begin
  raise exception 'member insert blocked' using errcode = 'P0001';
end;
$$;

create trigger edenida_test_block_member
  before insert on public.wedding_members
  for each row
  execute function public.edenida_test_block_member();

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
select throws_ok(
  $$ select public.create_wedding_with_owner('Rollback Wedding', null, 'America/Toronto', 'CAD') $$,
  'P0001',
  null,
  'membership failure aborts the function'
);
set local role postgres;
select is(
  (select count(*)::int from public.weddings where title = 'Rollback Wedding'),
  0,
  'transaction does not leave a wedding without its owner'
);

select * from finish();
rollback;
