-- RLS behavior: User A / User B isolation + anon deny + forged membership deny.
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- Minimal auth.users rows (password unused by these RLS tests)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'user-a@edenida.test',
    'not-used',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'user-b@edenida.test',
    'not-used',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"User B"}'::jsonb,
    now(),
    now()
  );

select ok(
  exists (select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
  'profile A created by trigger'
);
select ok(
  exists (select 1 from public.profiles where id = '22222222-2222-2222-2222-222222222222'::uuid),
  'profile B created by trigger'
);

set local role postgres;

insert into public.weddings (id, title, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wedding A', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Wedding B', '22222222-2222-2222-2222-222222222222');

insert into public.wedding_members (wedding_id, user_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner');

-- User A
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.weddings where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  1,
  'User A can SELECT Wedding A'
);

select is(
  (select count(*)::int from public.weddings where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  0,
  'User A cannot SELECT Wedding B'
);

update public.weddings
set title = 'Hacked'
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

select is(
  (
    select title
    from public.weddings
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  ),
  null,
  'User A cannot see Wedding B after unauthorized UPDATE attempt'
);

-- Verify as postgres that title unchanged
set local role postgres;
select is(
  (
    select title
    from public.weddings
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  ),
  'Wedding B',
  'User A unauthorized UPDATE Wedding B did not change title'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

delete from public.weddings
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

set local role postgres;
select is(
  (
    select count(*)::int
    from public.weddings
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  ),
  1,
  'User A unauthorized DELETE Wedding B did not remove row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$ insert into public.wedding_members (wedding_id, user_id, role)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner') $$,
  '42501'
);

-- User B
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.weddings where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  1,
  'User B can SELECT Wedding B'
);

select is(
  (select count(*)::int from public.weddings where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  0,
  'User B cannot SELECT Wedding A'
);

-- Anonymous
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select count(*) from public.weddings $$,
  '42501'
);

select * from finish();
rollback;
