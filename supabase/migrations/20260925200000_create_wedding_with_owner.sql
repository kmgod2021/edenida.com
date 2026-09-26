-- EDE-WORKSPACE-002: create a wedding and its owner membership in one transaction.
--
-- Two separate Data API inserts can commit the wedding and then fail the
-- membership insert, leaving an orphan the creator can still read
-- (weddings SELECT allows created_by = auth.uid() before a member row exists).
-- This function is the single write. It is SECURITY INVOKER: authenticated
-- already has INSERT on both tables, and existing RLS allows a caller to
-- insert a wedding as themselves and then bootstrap exactly one owner row.
-- SECURITY DEFINER is not required and is not used.
--
-- The caller cannot choose a user id. created_by and wedding_members.user_id
-- are always auth.uid().

create or replace function public.create_wedding_with_owner(
  p_title text,
  p_wedding_date date,
  p_timezone text,
  p_currency text
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_wedding_id uuid;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_title is null
    or char_length(btrim(p_title)) < 1
    or char_length(btrim(p_title)) > 80
  then
    raise exception 'invalid wedding title' using errcode = '22023';
  end if;

  if p_timezone is null or p_timezone !~ '^[A-Za-z0-9_+/-]{1,64}$' then
    raise exception 'invalid timezone' using errcode = '22023';
  end if;

  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid currency' using errcode = '22023';
  end if;

  insert into public.weddings (
    title,
    wedding_date,
    timezone,
    currency,
    created_by
  )
  values (
    btrim(p_title),
    p_wedding_date,
    p_timezone,
    p_currency,
    v_user_id
  )
  returning id into v_wedding_id;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (
    v_wedding_id,
    v_user_id,
    'owner'::public.wedding_member_role
  );

  return v_wedding_id;
end;
$$;

revoke all on function public.create_wedding_with_owner(text, date, text, text) from public;
revoke all on function public.create_wedding_with_owner(text, date, text, text) from anon;
revoke all on function public.create_wedding_with_owner(text, date, text, text) from authenticated;
grant execute on function public.create_wedding_with_owner(text, date, text, text) to authenticated;

comment on function public.create_wedding_with_owner(text, date, text, text) is
  'Atomically inserts a wedding for auth.uid() and one owner membership for that same user.';
