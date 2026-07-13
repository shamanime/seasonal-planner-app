create index if not exists family_activities_calendar_season_idx
on public.family_activities (calendar_id, season_id);

create or replace function public.enforce_family_activity_season_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  activity_count integer;
begin
  -- Serialize writes to the same calendar/season so concurrent requests cannot
  -- both observe the last available slot.
  perform pg_advisory_xact_lock(
    hashtextextended(new.calendar_id::text || ':' || new.season_id::text, 0)
  );

  select count(*)
  into activity_count
  from public.family_activities
  where calendar_id = new.calendar_id
    and season_id = new.season_id
    and id <> new.id;

  if activity_count >= 15 then
    raise exception using
      errcode = '23514',
      message = 'A season can have at most 15 activities.',
      detail = format('Calendar %s already has 15 activities in season %s.', new.calendar_id, new.season_id),
      hint = 'Delete an activity from this season before adding another one.';
  end if;

  return new;
end;
$$;

comment on function public.enforce_family_activity_season_limit() is
'Prevents a family calendar from having more than 15 activities in one season.';

drop trigger if exists enforce_family_activity_season_limit on public.family_activities;
create trigger enforce_family_activity_season_limit
before insert or update of calendar_id, season_id on public.family_activities
for each row execute function public.enforce_family_activity_season_limit();
