-- Guests + RSVP relational foundation: schema, grants, and tenant constraints.
begin;
create extension if not exists pgtap with schema extensions;

select plan(65);

select has_table('public', 'households', 'households exists');
select has_table('public', 'events', 'events exists');
select has_table('public', 'guests', 'guests exists');
select has_table('public', 'guest_events', 'guest_events exists');
select has_table('public', 'invitations', 'invitations exists');
select has_table('public', 'rsvp_sessions', 'rsvp_sessions exists');
select has_table('public', 'rsvps', 'rsvps exists');
select has_table('public', 'rsvp_answers', 'rsvp_answers exists');

select is(
  (
    select count(*)::int
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'households',
        'events',
        'guests',
        'guest_events',
        'invitations',
        'rsvp_sessions',
        'rsvps',
        'rsvp_answers'
      )
      and c.relrowsecurity
  ),
  8,
  'RLS enabled on all new guest/rsvp tables'
);

select is(
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invitations'
      and column_name = 'token_hash'
  ),
  'bytea',
  'token_hash is bytea'
);
select is(
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rsvp_sessions'
      and column_name = 'session_hash'
  ),
  'bytea',
  'session_hash is bytea'
);

select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invitations'
      and column_name in ('token', 'raw_token', 'invitation_token')
  ),
  0,
  'invitations has no raw token column'
);
select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rsvp_sessions'
      and column_name in ('session_secret', 'raw_session_secret', 'cookie_value')
  ),
  0,
  'rsvp_sessions has no raw session secret column'
);

select has_index('public', 'households', 'households_wedding_id_idx', 'households wedding index');
select has_index('public', 'events', 'events_wedding_id_starts_at_idx', 'events wedding/start index');
select has_index('public', 'guests', 'guests_wedding_name_idx', 'guests name index');
select has_index('public', 'guests', 'guests_household_id_idx', 'guests household index');
select has_index('public', 'guest_events', 'guest_events_wedding_guest_idx', 'guest_events by guest');
select has_index('public', 'guest_events', 'guest_events_wedding_event_idx', 'guest_events by event');
select has_index('public', 'guest_events', 'guest_events_guest_event_key', 'guest_events unique pair');
select has_index('public', 'invitations', 'invitations_wedding_guest_idx', 'invitations by guest');
select has_index('public', 'invitations', 'invitations_token_hash_key', 'token_hash unique');
select has_index('public', 'invitations', 'invitations_one_active_guest_idx', 'one active invitation index');
select has_index('public', 'rsvp_sessions', 'rsvp_sessions_session_hash_key', 'session_hash unique');
select has_index('public', 'rsvps', 'rsvps_one_per_guest', 'one rsvp per guest');
select has_index('public', 'rsvp_answers', 'rsvp_answers_rsvp_event_key', 'one answer per rsvp event');
select has_index('public', 'rsvp_answers', 'rsvp_answers_wedding_rsvp_idx', 'answers by rsvp');
select has_index('public', 'rsvp_answers', 'rsvp_answers_wedding_event_idx', 'answers by event');

select ok(
  (
    select indexdef
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invitations_one_active_guest_idx'
  ) ilike '%where (revoked_at is null)%',
  'active invitation uniqueness ignores revoked rows'
);

select ok(
  exists (select 1 from pg_constraint where conname = 'guests_household_same_wedding_fkey'),
  'guest household FK is wedding-scoped'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'guest_events_guest_same_wedding_fkey'),
  'guest_events guest FK is wedding-scoped'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'guest_events_event_same_wedding_fkey'),
  'guest_events event FK is wedding-scoped'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'invitations_guest_same_wedding_fkey'),
  'invitation guest FK is wedding-scoped'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'invitations_replacement_same_guest_fkey'),
  'replacement invitation stays on the same guest'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'rsvps_invitation_same_guest_fkey'),
  'rsvp invitation FK is the same guest and wedding'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'rsvp_answers_event_same_wedding_fkey'),
  'rsvp answer event FK is wedding-scoped'
);

select is(
  (
    select count(*)::int
    from unnest(array[
      'households',
      'events',
      'guests',
      'guest_events',
      'invitations',
      'rsvp_sessions',
      'rsvps',
      'rsvp_answers'
    ]) as t
    cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
    where has_table_privilege('anon', format('public.%I', t), p)
  ),
  0,
  'anon has no direct table DML on guest/rsvp tables'
);

select is(
  (
    select count(*)::int
    from unnest(array['invitations', 'rsvp_sessions']) as t
    cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
    where has_table_privilege('authenticated', format('public.%I', t), p)
  ),
  0,
  'authenticated has no direct DML on invitations or sessions'
);

select ok(
  not has_column_privilege('anon', 'public.invitations', 'token_hash', 'SELECT')
  and not has_column_privilege('authenticated', 'public.invitations', 'token_hash', 'SELECT')
  and not has_column_privilege('service_role', 'public.invitations', 'token_hash', 'SELECT'),
  'token_hash is not selectable by API roles'
);
select ok(
  not has_column_privilege('anon', 'public.rsvp_sessions', 'session_hash', 'SELECT')
  and not has_column_privilege('authenticated', 'public.rsvp_sessions', 'session_hash', 'SELECT')
  and not has_column_privilege('service_role', 'public.rsvp_sessions', 'session_hash', 'SELECT'),
  'session_hash is not selectable by API roles'
);

select ok(
  has_table_privilege('authenticated', 'public.guests', 'SELECT')
  and has_table_privilege('authenticated', 'public.guests', 'INSERT')
  and has_table_privilege('authenticated', 'public.guests', 'DELETE')
  and has_column_privilege('authenticated', 'public.guests', 'first_name', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.guests', 'wedding_id', 'UPDATE'),
  'authenticated guest grants allow edits and keep wedding_id immutable'
);
select ok(
  not has_table_privilege('authenticated', 'public.households', 'DELETE')
  and not has_table_privilege('authenticated', 'public.events', 'DELETE'),
  'household and event delete is not granted'
);

select is_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and tablename = 'invitations' $$,
  'invitations has no client policies'
);
select is_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and tablename = 'rsvp_sessions' $$,
  'rsvp_sessions has no client policies'
);

select ok(
  not exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where p.proname in (
      'exchange_rsvp_session',
      'read_rsvp',
      'submit_rsvp',
      'rsvp_token_pepper'
    )
  ),
  'credential RPCs and pepper helper are not created'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'e5111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'schema-owner@edenida.test',
  'x',
  now(),
  '{}'::jsonb,
  '{"full_name":"Schema Owner"}'::jsonb,
  now(),
  now()
);

insert into public.weddings (id, title, created_by) values
  ('e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Schema A', 'e5111111-1111-1111-1111-111111111111'),
  ('e5bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Schema B', 'e5111111-1111-1111-1111-111111111111'),
  ('e5cccccc-cccc-cccc-cccc-cccccccccccc', 'Schema C', 'e5111111-1111-1111-1111-111111111111');

insert into public.households (id, wedding_id, name) values
  ('e5a00001-0000-0000-0000-000000000001', 'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'House A'),
  ('e5b00001-0000-0000-0000-000000000001', 'e5bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'House B');

insert into public.events (id, wedding_id, name) values
  ('e5a00002-0000-0000-0000-000000000002', 'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ceremony'),
  ('e5b00002-0000-0000-0000-000000000002', 'e5bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Dinner');

insert into public.guests (id, wedding_id, household_id, first_name, last_name) values
  ('e5a00003-0000-0000-0000-000000000003', 'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e5a00001-0000-0000-0000-000000000001', 'Ada', 'Lovelace'),
  ('e5a00004-0000-0000-0000-000000000004', 'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'Grace', 'Hopper'),
  ('e5b00003-0000-0000-0000-000000000003', 'e5bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e5b00001-0000-0000-0000-000000000001', 'Alan', 'Turing');

select ok(
  exists (
    select 1 from public.guests
    where id = 'e5a00004-0000-0000-0000-000000000004'::uuid
      and household_id is null
  ),
  'a guest may exist without a household'
);

select throws_ok(
  $$ insert into public.households (wedding_id, name)
     values ('e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '  Smiths') $$,
  '23514'
);

select throws_ok(
  $$ insert into public.guests (wedding_id, household_id, first_name, last_name)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5b00001-0000-0000-0000-000000000001'::uuid,
       'Cross',
       'House'
     ) $$,
  '23503'
);

select throws_ok(
  $$ insert into public.guest_events (wedding_id, guest_id, event_id)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00003-0000-0000-0000-000000000003'::uuid,
       'e5b00002-0000-0000-0000-000000000002'::uuid
     ) $$,
  '23503'
);

insert into public.invitations (
  id, wedding_id, guest_id, token_hash, issued_at, expires_at
) values (
  'e5b00004-0000-0000-0000-000000000004',
  'e5bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'e5b00003-0000-0000-0000-000000000003',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-01 00:00:00+00',
  timestamptz '2026-10-01 00:00:00+00'
);

select throws_ok(
  $$ insert into public.rsvps (wedding_id, guest_id, invitation_id, status, source)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00003-0000-0000-0000-000000000003'::uuid,
       'e5b00004-0000-0000-0000-000000000004'::uuid,
       'pending',
       'couple'
     ) $$,
  '23503'
);

insert into public.rsvps (id, wedding_id, guest_id, status, source) values (
  'e5a00005-0000-0000-0000-000000000005',
  'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e5a00003-0000-0000-0000-000000000003',
  'attending',
  'couple'
);

select throws_ok(
  $$ insert into public.rsvp_answers (wedding_id, rsvp_id, event_id, attending)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00005-0000-0000-0000-000000000005'::uuid,
       'e5b00002-0000-0000-0000-000000000002'::uuid,
       true
     ) $$,
  '23503'
);

insert into public.invitations (
  id, wedding_id, guest_id, token_hash, issued_at, expires_at, revoked_at, revoked_reason
) values (
  'e5a00006-0000-0000-0000-000000000006',
  'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e5a00003-0000-0000-0000-000000000003',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-01 00:00:00+00',
  timestamptz '2026-10-01 00:00:00+00',
  timestamptz '2026-09-02 00:00:00+00',
  'couple'
);

insert into public.invitations (
  id, wedding_id, guest_id, token_hash, issued_at, expires_at
) values (
  'e5a00007-0000-0000-0000-000000000007',
  'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e5a00003-0000-0000-0000-000000000003',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-02 00:00:00+00',
  timestamptz '2026-10-01 00:00:00+00'
);

select is(
  (
    select count(*)::int
    from public.invitations
    where guest_id = 'e5a00003-0000-0000-0000-000000000003'::uuid
  ),
  2,
  'a revoked invitation and one active invitation can coexist'
);

select throws_ok(
  $$ insert into public.invitations (
       wedding_id, guest_id, token_hash, issued_at, expires_at
     ) values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00003-0000-0000-0000-000000000003'::uuid,
       extensions.gen_random_bytes(32),
       timestamptz '2026-09-03 00:00:00+00',
       timestamptz '2026-10-01 00:00:00+00'
     ) $$,
  '23505'
);

select throws_ok(
  $$ insert into public.rsvps (wedding_id, guest_id)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00003-0000-0000-0000-000000000003'::uuid
     ) $$,
  '23505'
);

insert into public.rsvp_answers (id, wedding_id, rsvp_id, event_id, attending) values (
  'e5a00008-0000-0000-0000-000000000008',
  'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e5a00005-0000-0000-0000-000000000005',
  'e5a00002-0000-0000-0000-000000000002',
  true
);

select throws_ok(
  $$ insert into public.rsvp_answers (wedding_id, rsvp_id, event_id, attending)
     values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00005-0000-0000-0000-000000000005'::uuid,
       'e5a00002-0000-0000-0000-000000000002'::uuid,
       false
     ) $$,
  '23505'
);

select throws_ok(
  $$ insert into public.invitations (
       wedding_id, guest_id, token_hash, issued_at, expires_at
     ) values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00004-0000-0000-0000-000000000004'::uuid,
       decode(repeat('ab', 16), 'hex'),
       timestamptz '2026-09-01 00:00:00+00',
       timestamptz '2026-10-01 00:00:00+00'
     ) $$,
  '23514'
);

select throws_ok(
  $$ insert into public.invitations (
       wedding_id, guest_id, token_hash, issued_at, expires_at,
       revoked_at, revoked_reason, replaced_by_invitation_id
     ) values (
       'e5aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'e5a00004-0000-0000-0000-000000000004'::uuid,
       extensions.gen_random_bytes(32),
       timestamptz '2026-09-01 00:00:00+00',
       timestamptz '2026-10-01 00:00:00+00',
       timestamptz '2026-09-02 00:00:00+00',
       'regenerated',
       'e5b00004-0000-0000-0000-000000000004'::uuid
     ) $$,
  '23503'
);

insert into public.rsvp_sessions (
  id, invitation_id, session_hash, expires_at, created_at
) values (
  'e5a00009-0000-0000-0000-000000000009',
  'e5a00007-0000-0000-0000-000000000007',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-02 12:00:00+00',
  timestamptz '2026-09-02 00:00:00+00'
);

update public.invitations
set revoked_at = timestamptz '2026-09-03 00:00:00+00',
    revoked_reason = 'couple'
where id = 'e5a00007-0000-0000-0000-000000000007'::uuid;

select is(
  (
    select revoked_at
    from public.rsvp_sessions
    where id = 'e5a00009-0000-0000-0000-000000000009'::uuid
  ),
  timestamptz '2026-09-03 00:00:00+00',
  'revoking an invitation revokes its active session'
);

select throws_ok(
  $$ insert into public.rsvp_sessions (
       invitation_id, session_hash, expires_at, created_at
     ) values (
       'e5a00006-0000-0000-0000-000000000006'::uuid,
       extensions.gen_random_bytes(32),
       timestamptz '2026-09-01 13:00:00+00',
       timestamptz '2026-09-01 00:00:00+00'
     ) $$,
  '23514'
);

select throws_ok(
  $$ insert into public.rsvp_sessions (
       invitation_id, session_hash, expires_at, created_at
     ) values (
       'e5b00004-0000-0000-0000-000000000004'::uuid,
       extensions.gen_random_bytes(32),
       timestamptz '2026-10-02 00:00:00+00',
       timestamptz '2026-10-01 18:00:00+00'
     ) $$,
  '23514'
);

insert into public.rsvp_sessions (
  id, invitation_id, session_hash, expires_at, created_at
) values (
  'e5b00009-0000-0000-0000-000000000009',
  'e5b00004-0000-0000-0000-000000000004',
  extensions.gen_random_bytes(32),
  timestamptz '2026-09-01 06:00:00+00',
  timestamptz '2026-09-01 00:00:00+00'
);

delete from public.invitations
where id = 'e5b00004-0000-0000-0000-000000000004'::uuid;

select is(
  (
    select count(*)::int
    from public.rsvp_sessions
    where id = 'e5b00009-0000-0000-0000-000000000009'::uuid
  ),
  0,
  'deleting an invitation deletes its sessions'
);

delete from public.households
where id = 'e5a00001-0000-0000-0000-000000000001'::uuid;

select is(
  (
    select household_id::text
    from public.guests
    where id = 'e5a00003-0000-0000-0000-000000000003'::uuid
  ),
  null,
  'deleting a household detaches guests instead of deleting them'
);
select is(
  (
    select count(*)::int
    from public.guests
    where id = 'e5a00003-0000-0000-0000-000000000003'::uuid
  ),
  1,
  'deleting a household keeps the guest row'
);

insert into public.households (id, wedding_id, name) values
  ('e5c00001-0000-0000-0000-000000000001', 'e5cccccc-cccc-cccc-cccc-cccccccccccc', 'House C');
insert into public.guests (id, wedding_id, household_id, first_name, last_name) values
  (
    'e5c00003-0000-0000-0000-000000000003',
    'e5cccccc-cccc-cccc-cccc-cccccccccccc',
    'e5c00001-0000-0000-0000-000000000001',
    'Lin',
    'Us'
  );

delete from public.weddings
where id = 'e5cccccc-cccc-cccc-cccc-cccccccccccc'::uuid;

select is(
  (
    select count(*)::int
    from public.guests
    where wedding_id = 'e5cccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  ),
  0,
  'deleting a wedding removes its guests'
);
select is(
  (
    select count(*)::int
    from public.households
    where wedding_id = 'e5cccccc-cccc-cccc-cccc-cccccccccccc'::uuid
  ),
  0,
  'deleting a wedding removes its households'
);

select * from finish();
rollback;
