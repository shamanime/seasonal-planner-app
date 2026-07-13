-- Enforce the account calendar allowance in Postgres so every API client shares
-- the same rule and concurrent requests cannot exceed the limit.
create or replace function public.calendar_slot_limit(p_created_at date, p_as_of date)
returns integer
language sql
immutable
set search_path = ''
as $$
  with candidate as (
    select greatest(0, extract(year from p_as_of)::integer - extract(year from p_created_at)::integer) as years
  )
  select 3 + greatest(
    0,
    years - case when p_created_at + years * interval '1 year' > p_as_of then 1 else 0 end
  )
  from candidate;
$$;

create or replace function public.get_calendar_quota()
returns table (
  calendar_count bigint,
  calendar_limit integer,
  next_slot_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    (select count(*) from public.family_calendars c where c.owner_id = u.id),
    q.calendar_limit,
    u.created_at + (q.calendar_limit - 2) * interval '1 year'
  from auth.users u
  cross join lateral (
    select public.calendar_slot_limit(u.created_at::date, current_date) as calendar_limit
  ) q
  where u.id = auth.uid();
$$;

create or replace function public.enforce_calendar_quota()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_calendar_count bigint;
  v_calendar_limit integer;
begin
  if tg_op = 'UPDATE' and new.owner_id = old.owner_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 0));

  select
    count(c.id),
    public.calendar_slot_limit(u.created_at::date, current_date)
  into v_calendar_count, v_calendar_limit
  from auth.users u
  left join public.family_calendars c on c.owner_id = u.id
  where u.id = new.owner_id
  group by u.created_at;

  if v_calendar_limit is null then
    raise exception using errcode = '23503', message = 'Calendar owner account not found.';
  end if;

  if v_calendar_count >= v_calendar_limit then
    raise exception using
      errcode = 'P0001',
      message = 'CALENDAR_LIMIT_REACHED',
      detail = format('This account can currently have %s calendars.', v_calendar_limit);
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_calendar_quota on public.family_calendars;
create trigger enforce_calendar_quota
before insert or update of owner_id on public.family_calendars
for each row execute function public.enforce_calendar_quota();

create or replace function public.clone_calendar_from_template(
  p_template_id uuid,
  p_title text,
  p_family_name text,
  p_share_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_calendar_id uuid;
  v_calendar_count bigint;
  v_calendar_limit integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  -- Serialize quota checks for this account while allowing unrelated accounts
  -- to create calendars concurrently.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select q.calendar_count, q.calendar_limit
  into v_calendar_count, v_calendar_limit
  from public.get_calendar_quota() q;

  if v_calendar_count >= v_calendar_limit then
    raise exception using
      errcode = 'P0001',
      message = 'CALENDAR_LIMIT_REACHED',
      detail = format('This account can currently have %s calendars.', v_calendar_limit);
  end if;

  if not exists (
    select 1
    from public.calendar_templates t
    where t.id = p_template_id and t.is_published
  ) then
    raise exception using errcode = 'P0002', message = 'Published template not found.';
  end if;

  insert into public.family_calendars (
    owner_id, template_id, title, family_name, share_slug, is_public, kiosk_enabled
  )
  values (
    v_user_id, p_template_id, p_title, nullif(trim(p_family_name), ''),
    p_share_slug, true, true
  )
  returning id into v_calendar_id;

  insert into public.family_activities (
    calendar_id, source_activity_id, season_id, title, date_label,
    description, notes, locations, tags, sort_order, is_favorite
  )
  select
    v_calendar_id, a.id, a.season_id, a.title, a.date_label,
    a.description, a.notes, a.locations, a.tags, a.sort_order, a.is_featured
  from public.template_activities a
  where a.template_id = p_template_id and a.is_published
  order by a.sort_order;

  return v_calendar_id;
end;
$$;

revoke all on function public.calendar_slot_limit(date, date) from public;
revoke all on function public.get_calendar_quota() from public;
revoke all on function public.enforce_calendar_quota() from public;
revoke all on function public.clone_calendar_from_template(uuid, text, text, text) from public;
grant execute on function public.get_calendar_quota() to authenticated;
grant execute on function public.clone_calendar_from_template(uuid, text, text, text) to authenticated;
