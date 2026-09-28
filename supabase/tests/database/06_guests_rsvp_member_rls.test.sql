-- Member RLS for Guests + RSVP, plus direct denial of secret tables.
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'f1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'guest-owner-a@edenida.test', 'x', now(), '{}'::jsonb, '{"full_name":"Owner A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f5555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'guest-viewer-a@edenida.test', 'x', now(), '{}'::jsonb, '{"full_name":"Viewer A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f6666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'guest-outsider@edenida.test', 'x', now(), '{}'::jsonb, '{"full_name":"Outsider"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f7777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'guest-owner-b@edenida.test', 'x', now(), '{}'::jsonb, '{"full_name":"Owner B"}'::jsonb, now(), now());

set local role postgres;

insert into public.weddings (id, title, created_by) values
  ('fa111111-1111-1111-1111-111111111111', 'Wedding A', 'f1111111-1111-1111-1111-111111111111'),
  ('fb111111-1111-1111-1111-111111111111', 'Wedding B', 'f7777777-7777-7777-7777-777777777777');

insert into public.wedding_members (wedding_id, user_id, role) values
  ('fa111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'owner'),
  ('fa111111-1111-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555555', 'viewer'),
  ('fb111111-1111-1111-1111-111111111111', 'f7777777-7777-7777-7777-777777777777', 'owner');

insert into public.households (id, wedding_id, name) values
  ('fb000001-0001-0001-0001-000000000001', 'fb111111-1111-1111-1111-111111111111', 'House B');
insert into public.events (id, wedding_id, name) values
  ('fb000002-0002-0002-0002-000000000002', 'fb111111-1111-1111-1111-111111111111', 'Dinner');
insert into public.guests (id, wedding_id, household_id, first_name, last_name) values
  ('fb000003-0003-0003-0003-000000000003', 'fb111111-1111-1111-1111-111111111111', 'fb000001-0001-0001-0001-000000000001', 'Bea', 'Guest');
insert into public.invitations (
  id, wedding_id, guest_id, token_hash, issued_at, expires_at
) values (
  'fb000004-0004-0004-0004-000000000004',
  'fb111111-1111-1111-1111-111111111111',
  'fb000003-0003-0003-0003-000000000003',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-01 00:00:00+00',
  timestamptz '2026-10-01 00:00:00+00'
);
insert into public.rsvp_sessions (
  id, invitation_id, session_hash, expires_at, created_at
) values (
  'fb000009-0009-0009-0009-000000000009',
  'fb000004-0004-0004-0004-000000000004',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-01 06:00:00+00',
  timestamptz '2026-09-01 00:00:00+00'
);

-- Owner / editor
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

insert into public.households (id, wedding_id, name) values
  ('fa000001-0001-0001-0001-000000000001', 'fa111111-1111-1111-1111-111111111111', 'House A');
insert into public.events (id, wedding_id, name, starts_at) values
  ('fa000002-0002-0002-0002-000000000002', 'fa111111-1111-1111-1111-111111111111', 'Ceremony', timestamptz '2026-10-03 15:00:00+00');
insert into public.guests (
  id, wedding_id, household_id, first_name, last_name, plus_one_allowed, invitation_status
) values (
  'fa000003-0003-0003-0003-000000000003',
  'fa111111-1111-1111-1111-111111111111',
  'fa000001-0001-0001-0001-000000000001',
  'Ada',
  'Lovelace',
  true,
  'invited'
);
insert into public.guests (id, wedding_id, first_name, last_name) values (
  'fa000013-0013-0013-0013-000000000013',
  'fa111111-1111-1111-1111-111111111111',
  'Temp',
  'Guest'
);
insert into public.guest_events (wedding_id, guest_id, event_id) values (
  'fa111111-1111-1111-1111-111111111111',
  'fa000003-0003-0003-0003-000000000003',
  'fa000002-0002-0002-0002-000000000002'
);
insert into public.rsvps (id, wedding_id, guest_id, status, source, meal_choice) values (
  'fa000005-0005-0005-0005-000000000005',
  'fa111111-1111-1111-1111-111111111111',
  'fa000003-0003-0003-0003-000000000003',
  'attending',
  'couple',
  'fish'
);
insert into public.rsvp_answers (id, wedding_id, rsvp_id, event_id, attending) values (
  'fa000006-0006-0006-0006-000000000006',
  'fa111111-1111-1111-1111-111111111111',
  'fa000005-0005-0005-0005-000000000005',
  'fa000002-0002-0002-0002-000000000002',
  true
);

update public.guests
set first_name = 'Augusta', updated_at = now()
where id = 'fa000003-0003-0003-0003-000000000003'::uuid;

update public.households
set name = 'House Ada', updated_at = now()
where id = 'fa000001-0001-0001-0001-000000000001'::uuid;

delete from public.guests
where id = 'fa000013-0013-0013-0013-000000000013'::uuid;

select is(
  (select first_name from public.guests where id = 'fa000003-0003-0003-0003-000000000003'::uuid),
  'Augusta',
  'owner can update own guest'
);
select is(
  (select count(*)::int from public.households where id = 'fa000001-0001-0001-0001-000000000001'::uuid),
  1,
  'owner can read own household'
);
select is(
  (select count(*)::int from public.guest_events where guest_id = 'fa000003-0003-0003-0003-000000000003'::uuid),
  1,
  'owner can assign own guest to own event'
);
select is(
  (select status::text from public.rsvps where id = 'fa000005-0005-0005-0005-000000000005'::uuid),
  'attending',
  'owner can read own RSVP'
);
select is(
  (select count(*)::int from public.guests where id = 'fa000013-0013-0013-0013-000000000013'::uuid),
  0,
  'owner can delete own guest'
);

-- Viewer
select set_config(
  'request.jwt.claims',
  '{"sub":"f5555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.guests where id = 'fa000003-0003-0003-0003-000000000003'::uuid),
  1,
  'viewer can read guests'
);
select is(
  (select count(*)::int from public.households where wedding_id = 'fa111111-1111-1111-1111-111111111111'::uuid),
  1,
  'viewer can read households'
);
select is(
  (select count(*)::int from public.rsvps where wedding_id = 'fa111111-1111-1111-1111-111111111111'::uuid),
  1,
  'viewer can read RSVPs'
);

update public.guests
set first_name = 'Viewer Hack', updated_at = now()
where id = 'fa000003-0003-0003-0003-000000000003'::uuid;
update public.households
set name = 'Viewer Hack', updated_at = now()
where id = 'fa000001-0001-0001-0001-000000000001'::uuid;
update public.rsvps
set status = 'declined', updated_at = now()
where id = 'fa000005-0005-0005-0005-000000000005'::uuid;
delete from public.guests
where id = 'fa000003-0003-0003-0003-000000000003'::uuid;

set local role postgres;
select is(
  (select first_name from public.guests where id = 'fa000003-0003-0003-0003-000000000003'::uuid),
  'Augusta',
  'viewer cannot mutate a guest'
);
select is(
  (select name from public.households where id = 'fa000001-0001-0001-0001-000000000001'::uuid),
  'House Ada',
  'viewer cannot mutate a household'
);
select is(
  (select status::text from public.rsvps where id = 'fa000005-0005-0005-0005-000000000005'::uuid),
  'attending',
  'viewer cannot mutate an RSVP'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f5555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select throws_ok(
  $$ insert into public.guests (wedding_id, first_name, last_name)
     values ('fa111111-1111-1111-1111-111111111111'::uuid, 'Nope', 'Viewer') $$,
  '42501'
);

-- Non-member
select set_config(
  'request.jwt.claims',
  '{"sub":"f6666666-6666-6666-6666-666666666666","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.guests where wedding_id = 'fa111111-1111-1111-1111-111111111111'::uuid),
  0,
  'non-member cannot read wedding A guests'
);

update public.guests
set first_name = 'Outsider', updated_at = now()
where id = 'fa000003-0003-0003-0003-000000000003'::uuid;

set local role postgres;
select is(
  (select first_name from public.guests where id = 'fa000003-0003-0003-0003-000000000003'::uuid),
  'Augusta',
  'non-member cannot write wedding A guests'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f6666666-6666-6666-6666-666666666666","role":"authenticated"}',
  true
);

select throws_ok(
  $$ insert into public.guests (wedding_id, first_name, last_name)
     values ('fa111111-1111-1111-1111-111111111111'::uuid, 'Nope', 'Outsider') $$,
  '42501'
);

-- Cross-wedding
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$ insert into public.guests (wedding_id, first_name, last_name)
     values ('fb111111-1111-1111-1111-111111111111'::uuid, 'Cross', 'Wedding') $$,
  '42501'
);

select throws_ok(
  $$ update public.guests
     set household_id = 'fb000001-0001-0001-0001-000000000001'::uuid,
         updated_at = now()
     where id = 'fa000003-0003-0003-0003-000000000003'::uuid $$,
  '23503'
);

select throws_ok(
  $$ insert into public.guest_events (wedding_id, guest_id, event_id)
     values (
       'fa111111-1111-1111-1111-111111111111'::uuid,
       'fa000003-0003-0003-0003-000000000003'::uuid,
       'fb000002-0002-0002-0002-000000000002'::uuid
     ) $$,
  '23503'
);

insert into public.guests (id, wedding_id, first_name, last_name) values (
  'fa000007-0007-0007-0007-000000000007',
  'fa111111-1111-1111-1111-111111111111',
  'Link',
  'Test'
);

select throws_ok(
  $$ insert into public.rsvps (wedding_id, guest_id, invitation_id)
     values (
       'fa111111-1111-1111-1111-111111111111'::uuid,
       'fa000007-0007-0007-0007-000000000007'::uuid,
       'fb000004-0004-0004-0004-000000000004'::uuid
     ) $$,
  '23503'
);

select throws_ok(
  $$ insert into public.rsvp_answers (wedding_id, rsvp_id, event_id, attending)
     values (
       'fa111111-1111-1111-1111-111111111111'::uuid,
       'fa000005-0005-0005-0005-000000000005'::uuid,
       'fb000002-0002-0002-0002-000000000002'::uuid,
       true
     ) $$,
  '23503'
);

-- Secret tables
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$ select token_hash from public.invitations $$, '42501');
select throws_ok(
  $$ insert into public.invitations (wedding_id, guest_id, token_hash, expires_at)
     values (
       'fa111111-1111-1111-1111-111111111111'::uuid,
       'fa000003-0003-0003-0003-000000000003'::uuid,
       decode(repeat('ab', 32), 'hex'),
       now() + interval '30 days'
     ) $$,
  '42501'
);
select throws_ok(
  $$ update public.invitations set revoked_reason = 'couple' where id = 'fb000004-0004-0004-0004-000000000004'::uuid $$,
  '42501'
);
select throws_ok($$ delete from public.invitations $$, '42501');
select throws_ok($$ select session_hash from public.rsvp_sessions $$, '42501');
select throws_ok(
  $$ insert into public.rsvp_sessions (invitation_id, session_hash, expires_at)
     values (
       'fb000004-0004-0004-0004-000000000004'::uuid,
       decode(repeat('cd', 32), 'hex'),
       now() + interval '1 hour'
     ) $$,
  '42501'
);
select throws_ok($$ update public.rsvp_sessions set last_seen_at = now() $$, '42501');
select throws_ok($$ delete from public.rsvp_sessions $$, '42501');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select throws_ok($$ select token_hash from public.invitations $$, '42501');
select throws_ok(
  $$ insert into public.invitations (wedding_id, guest_id, token_hash, expires_at)
     values (
       'fa111111-1111-1111-1111-111111111111'::uuid,
       'fa000003-0003-0003-0003-000000000003'::uuid,
       decode(repeat('ef', 32), 'hex'),
       now() + interval '30 days'
     ) $$,
  '42501'
);
select throws_ok(
  $$ update public.invitations set revoked_reason = 'couple' where id = 'fb000004-0004-0004-0004-000000000004'::uuid $$,
  '42501'
);
select throws_ok($$ delete from public.invitations $$, '42501');
select throws_ok($$ select session_hash from public.rsvp_sessions $$, '42501');
select throws_ok(
  $$ insert into public.rsvp_sessions (invitation_id, session_hash, expires_at)
     values (
       'fb000004-0004-0004-0004-000000000004'::uuid,
       decode(repeat('12', 32), 'hex'),
       now() + interval '1 hour'
     ) $$,
  '42501'
);
select throws_ok($$ update public.rsvp_sessions set last_seen_at = now() $$, '42501');
select throws_ok($$ delete from public.rsvp_sessions $$, '42501');

select * from finish();
rollback;
