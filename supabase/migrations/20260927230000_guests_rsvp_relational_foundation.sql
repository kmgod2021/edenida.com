-- EDE-GUEST-DATA-001A: Guests + RSVP relational foundation.
--
-- Member-scoped tables for households, the minimum event identity, guests,
-- guest-event invitations, and the current RSVP (one row per guest, plus
-- per-event answers). Invitation and session rows store digests only.
--
-- Not in this migration:
--   public.exchange_rsvp_session / read_rsvp / submit_rsvp
--   rsvp_internal, rsvp_definer, vault pepper
--   wedding_sites.slug
--
-- RSVP answer fields live on rsvps / rsvp_answers. Guests keep couple-controlled
-- planning columns (including plus_one_allowed and invitation_status). A
-- plus-one is not a second guest and has no plus_one_guest_id.
--
-- updated_at matches the foundation: default now() on insert, no generic
-- touch trigger. Writers set updated_at explicitly.
--
-- Household delete sets guests.household_id null and does not delete guests.
-- A before-delete trigger on weddings removes guests before households so
-- ON DELETE CASCADE (guest) and ON DELETE SET NULL (household) are not applied
-- to the same guest row in one statement.

create type public.guest_side as enum (
  'partner_a',
  'partner_b',
  'both',
  'unspecified'
);

create type public.guest_invitation_status as enum (
  'not_invited',
  'save_the_date',
  'invited'
);

create type public.rsvp_status as enum (
  'pending',
  'attending',
  'declined'
);

create type public.rsvp_source as enum (
  'guest',
  'couple'
);

create type public.meal_choice as enum (
  'unset',
  'meat',
  'fish',
  'vegetarian',
  'vegan',
  'child'
);

create type public.dietary_restriction as enum (
  'vegetarian',
  'vegan',
  'gluten_free',
  'lactose_free',
  'halal',
  'kosher',
  'other'
);

create type public.invitation_revoked_reason as enum (
  'regenerated',
  'couple',
  'guest_deleted',
  'pepper_rotation'
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_id_wedding_key unique (id, wedding_id),
  constraint households_name_trimmed check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  constraint households_address_trimmed check (
    address is null
    or (
      address = btrim(address)
      and char_length(address) between 1 and 500
    )
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_id_wedding_key unique (id, wedding_id),
  constraint events_name_trimmed check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  )
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  household_id uuid,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  group_label text,
  side public.guest_side not null default 'unspecified',
  is_child boolean not null default false,
  plus_one_allowed boolean not null default false,
  invitation_status public.guest_invitation_status not null default 'not_invited',
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_id_wedding_key unique (id, wedding_id),
  constraint guests_household_same_wedding_fkey
    foreign key (household_id, wedding_id)
    references public.households (id, wedding_id)
    on delete set null (household_id),
  constraint guests_first_name_trimmed check (
    first_name = btrim(first_name)
    and char_length(first_name) between 1 and 80
  ),
  constraint guests_last_name_trimmed check (
    last_name = btrim(last_name)
    and char_length(last_name) between 1 and 80
  ),
  constraint guests_email_trimmed check (
    email is null
    or (
      email = btrim(email)
      and char_length(email) between 1 and 320
    )
  ),
  constraint guests_phone_trimmed check (
    phone is null
    or (
      phone = btrim(phone)
      and char_length(phone) between 1 and 40
    )
  ),
  constraint guests_group_label_trimmed check (
    group_label is null
    or (
      group_label = btrim(group_label)
      and char_length(group_label) between 1 and 80
    )
  ),
  constraint guests_private_notes_trimmed check (
    private_notes is null
    or (
      private_notes = btrim(private_notes)
      and char_length(private_notes) between 1 and 4000
    )
  )
);

create table public.guest_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  constraint guest_events_guest_event_key unique (guest_id, event_id),
  constraint guest_events_guest_same_wedding_fkey
    foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id)
    on delete cascade,
  constraint guest_events_event_same_wedding_fkey
    foreign key (event_id, wedding_id)
    references public.events (id, wedding_id)
    on delete cascade
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null,
  token_hash bytea not null,
  pepper_id smallint not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason public.invitation_revoked_reason,
  last_used_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  replaced_by_invitation_id uuid,
  created_at timestamptz not null default now(),
  constraint invitations_id_wedding_guest_key unique (id, wedding_id, guest_id),
  constraint invitations_token_hash_key unique (token_hash),
  constraint invitations_guest_same_wedding_fkey
    foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id)
    on delete cascade,
  constraint invitations_replacement_same_guest_fkey
    foreign key (replaced_by_invitation_id, wedding_id, guest_id)
    references public.invitations (id, wedding_id, guest_id)
    on delete no action,
  constraint invitations_token_hash_len check (octet_length(token_hash) = 32),
  constraint invitations_pepper_id_positive check (pepper_id > 0),
  constraint invitations_expiry_after_issue check (expires_at > issued_at),
  constraint invitations_revoke_pair check (
    (revoked_at is null and revoked_reason is null)
    or (revoked_at is not null and revoked_reason is not null)
  ),
  constraint invitations_replacement_requires_revoke check (
    replaced_by_invitation_id is null or revoked_at is not null
  ),
  constraint invitations_not_self_replacement check (
    replaced_by_invitation_id is distinct from id
  ),
  constraint invitations_last_used_after_issue check (
    last_used_at is null or last_used_at >= issued_at
  )
);

create unique index invitations_one_active_guest_idx
  on public.invitations (guest_id)
  where revoked_at is null;

create table public.rsvp_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  session_hash bytea not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint rsvp_sessions_session_hash_key unique (session_hash),
  constraint rsvp_sessions_hash_len check (octet_length(session_hash) = 32),
  constraint rsvp_sessions_expiry_after_create check (expires_at > created_at)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null,
  invitation_id uuid,
  status public.rsvp_status not null default 'pending',
  source public.rsvp_source not null default 'couple',
  plus_one_attending boolean not null default false,
  plus_one_name text,
  plus_one_meal_choice public.meal_choice not null default 'unset',
  meal_choice public.meal_choice not null default 'unset',
  dietary public.dietary_restriction[] not null default '{}',
  dietary_note text,
  allergies text,
  message text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvps_id_wedding_key unique (id, wedding_id),
  constraint rsvps_one_per_guest unique (wedding_id, guest_id),
  constraint rsvps_guest_same_wedding_fkey
    foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id)
    on delete cascade,
  constraint rsvps_invitation_same_guest_fkey
    foreign key (invitation_id, wedding_id, guest_id)
    references public.invitations (id, wedding_id, guest_id)
    on delete no action,
  constraint rsvps_plus_one_name_trimmed check (
    plus_one_name is null
    or (
      plus_one_name = btrim(plus_one_name)
      and char_length(plus_one_name) between 1 and 160
    )
  ),
  constraint rsvps_dietary_note_trimmed check (
    dietary_note is null
    or (
      dietary_note = btrim(dietary_note)
      and char_length(dietary_note) between 1 and 2000
    )
  ),
  constraint rsvps_allergies_trimmed check (
    allergies is null
    or (
      allergies = btrim(allergies)
      and char_length(allergies) between 1 and 2000
    )
  ),
  constraint rsvps_message_trimmed check (
    message is null
    or (
      message = btrim(message)
      and char_length(message) between 1 and 2000
    )
  ),
  constraint rsvps_dietary_no_nulls check (array_position(dietary, null) is null)
);

create table public.rsvp_answers (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  rsvp_id uuid not null,
  event_id uuid not null,
  attending boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvp_answers_rsvp_event_key unique (rsvp_id, event_id),
  constraint rsvp_answers_rsvp_same_wedding_fkey
    foreign key (rsvp_id, wedding_id)
    references public.rsvps (id, wedding_id)
    on delete cascade,
  constraint rsvp_answers_event_same_wedding_fkey
    foreign key (event_id, wedding_id)
    references public.events (id, wedding_id)
    on delete cascade
);

create index households_wedding_id_idx on public.households (wedding_id);
create index events_wedding_id_starts_at_idx on public.events (wedding_id, starts_at);
create index guests_wedding_name_idx on public.guests (wedding_id, last_name, first_name);
create index guests_household_id_idx on public.guests (household_id);
create index guest_events_wedding_guest_idx on public.guest_events (wedding_id, guest_id);
create index guest_events_wedding_event_idx on public.guest_events (wedding_id, event_id);
create index invitations_wedding_guest_idx on public.invitations (wedding_id, guest_id);
create index rsvp_sessions_invitation_id_idx on public.rsvp_sessions (invitation_id);
create index rsvp_answers_wedding_rsvp_idx on public.rsvp_answers (wedding_id, rsvp_id);
create index rsvp_answers_wedding_event_idx on public.rsvp_answers (wedding_id, event_id);

comment on table public.guests is
  'Couple-managed guest identity. RSVP status, meals, dietary, allergies, and plus-one attendance live on rsvps.';
comment on column public.invitations.token_hash is
  '32-byte HMAC digest. The raw invitation token is never stored.';
comment on column public.rsvp_sessions.session_hash is
  '32-byte HMAC digest under the session label. The raw session secret is never stored.';

---------------------------------------------------------------------------
-- Delete ordering and session integrity. Trigger functions are not RPCs.
---------------------------------------------------------------------------

create or replace function private.prepare_guest_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invitations
  set replaced_by_invitation_id = null
  where guest_id = old.id
    and replaced_by_invitation_id is not null;

  update public.rsvps
  set invitation_id = null
  where guest_id = old.id
    and invitation_id is not null;

  return old;
end;
$$;

create or replace function private.clear_invitation_references()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invitations
  set replaced_by_invitation_id = null
  where replaced_by_invitation_id = old.id;

  update public.rsvps
  set invitation_id = null
  where invitation_id = old.id;

  return old;
end;
$$;

create or replace function private.delete_guests_before_wedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.guests
  where wedding_id = old.id;

  return old;
end;
$$;

create or replace function private.revoke_sessions_for_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rsvp_sessions
  set revoked_at = new.revoked_at
  where invitation_id = new.id
    and revoked_at is null;

  return new;
end;
$$;

create or replace function private.guard_rsvp_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revoked timestamptz;
  v_expires timestamptz;
begin
  select i.revoked_at, i.expires_at
  into v_revoked, v_expires
  from public.invitations as i
  where i.id = new.invitation_id;

  if not found then
    return new;
  end if;

  if v_revoked is not null and new.revoked_at is null then
    new.revoked_at := v_revoked;
  end if;

  if new.expires_at > v_expires then
    raise exception 'rsvp session expires after its invitation'
      using errcode = '23514';
  end if;

  if new.expires_at > new.created_at + interval '12 hours' then
    raise exception 'rsvp session lifetime exceeds 12 hours'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger guests_prepare_delete
  before delete on public.guests
  for each row execute function private.prepare_guest_delete();

create trigger invitations_clear_references
  before delete on public.invitations
  for each row execute function private.clear_invitation_references();

create trigger weddings_delete_guests_first
  before delete on public.weddings
  for each row execute function private.delete_guests_before_wedding();

create trigger invitations_revoke_sessions
  after update of revoked_at on public.invitations
  for each row
  when (new.revoked_at is not null and old.revoked_at is distinct from new.revoked_at)
  execute function private.revoke_sessions_for_invitation();

create trigger rsvp_sessions_guard
  before insert or update of invitation_id, expires_at, revoked_at, created_at
  on public.rsvp_sessions
  for each row execute function private.guard_rsvp_session();

revoke all on function private.prepare_guest_delete() from public, anon, authenticated;
revoke all on function private.clear_invitation_references() from public, anon, authenticated;
revoke all on function private.delete_guests_before_wedding() from public, anon, authenticated;
revoke all on function private.revoke_sessions_for_invitation() from public, anon, authenticated;
revoke all on function private.guard_rsvp_session() from public, anon, authenticated;

-- Authenticated members delete weddings and guests. Trigger functions are not
-- callable as queries (return type trigger) and live outside the Data API.
grant execute on function private.prepare_guest_delete() to authenticated;
grant execute on function private.clear_invitation_references() to authenticated;
grant execute on function private.delete_guests_before_wedding() to authenticated;

---------------------------------------------------------------------------
-- Grants. auto_expose may have granted API roles; revoke, then re-grant.
-- invitations and rsvp_sessions stay inaccessible to API roles.
---------------------------------------------------------------------------

revoke all on table public.households from public, anon, authenticated;
revoke all on table public.events from public, anon, authenticated;
revoke all on table public.guests from public, anon, authenticated;
revoke all on table public.guest_events from public, anon, authenticated;
revoke all on table public.invitations from public, anon, authenticated, service_role;
revoke all on table public.rsvp_sessions from public, anon, authenticated, service_role;
revoke all on table public.rsvps from public, anon, authenticated;
revoke all on table public.rsvp_answers from public, anon, authenticated;

revoke select (token_hash) on table public.invitations from public, anon, authenticated, service_role;
revoke select (session_hash) on table public.rsvp_sessions from public, anon, authenticated, service_role;

grant select, insert on table public.households to authenticated;
grant update (name, address, updated_at) on table public.households to authenticated;

grant select, insert on table public.events to authenticated;
grant update (name, starts_at, updated_at) on table public.events to authenticated;

grant select, insert, delete on table public.guests to authenticated;
grant update (
  first_name,
  last_name,
  email,
  phone,
  household_id,
  group_label,
  side,
  is_child,
  plus_one_allowed,
  invitation_status,
  private_notes,
  updated_at
) on table public.guests to authenticated;

grant select, insert, delete on table public.guest_events to authenticated;

grant select, insert, delete on table public.rsvps to authenticated;
grant update (
  invitation_id,
  status,
  source,
  plus_one_attending,
  plus_one_name,
  plus_one_meal_choice,
  meal_choice,
  dietary,
  dietary_note,
  allergies,
  message,
  submitted_at,
  updated_at
) on table public.rsvps to authenticated;

grant select, insert, delete on table public.rsvp_answers to authenticated;
grant update (attending, updated_at) on table public.rsvp_answers to authenticated;

alter table public.households enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.guest_events enable row level security;
alter table public.invitations enable row level security;
alter table public.rsvp_sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.rsvp_answers enable row level security;

create policy households_select_member
  on public.households for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy households_insert_editor
  on public.households for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy households_update_editor
  on public.households for update to authenticated
  using (private.can_edit_wedding(wedding_id))
  with check (private.can_edit_wedding(wedding_id));

create policy events_select_member
  on public.events for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy events_insert_editor
  on public.events for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy events_update_editor
  on public.events for update to authenticated
  using (private.can_edit_wedding(wedding_id))
  with check (private.can_edit_wedding(wedding_id));

create policy guests_select_member
  on public.guests for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy guests_insert_editor
  on public.guests for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy guests_update_editor
  on public.guests for update to authenticated
  using (private.can_edit_wedding(wedding_id))
  with check (private.can_edit_wedding(wedding_id));

create policy guests_delete_editor
  on public.guests for delete to authenticated
  using (private.can_edit_wedding(wedding_id));

create policy guest_events_select_member
  on public.guest_events for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy guest_events_insert_editor
  on public.guest_events for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy guest_events_delete_editor
  on public.guest_events for delete to authenticated
  using (private.can_edit_wedding(wedding_id));

create policy rsvps_select_member
  on public.rsvps for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy rsvps_insert_editor
  on public.rsvps for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy rsvps_update_editor
  on public.rsvps for update to authenticated
  using (private.can_edit_wedding(wedding_id))
  with check (private.can_edit_wedding(wedding_id));

create policy rsvps_delete_editor
  on public.rsvps for delete to authenticated
  using (private.can_edit_wedding(wedding_id));

create policy rsvp_answers_select_member
  on public.rsvp_answers for select to authenticated
  using (private.is_wedding_member(wedding_id));

create policy rsvp_answers_insert_editor
  on public.rsvp_answers for insert to authenticated
  with check (private.can_edit_wedding(wedding_id));

create policy rsvp_answers_update_editor
  on public.rsvp_answers for update to authenticated
  using (private.can_edit_wedding(wedding_id))
  with check (private.can_edit_wedding(wedding_id));

create policy rsvp_answers_delete_editor
  on public.rsvp_answers for delete to authenticated
  using (private.can_edit_wedding(wedding_id));
