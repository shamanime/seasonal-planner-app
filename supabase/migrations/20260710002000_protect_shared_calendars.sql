-- Public calendars must only be retrievable by their unguessable share slug.
-- A broad RLS `is_public` policy lets anyone enumerate every public calendar through the API.
drop policy if exists "Calendars readable by owner or share link" on public.family_calendars;
create policy "Calendars readable by owner or admin"
on public.family_calendars for select
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Activities readable through calendar" on public.family_activities;
create policy "Activities readable by owner or admin"
on public.family_activities for select
using (
  public.is_admin() or exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
      and family_calendars.owner_id = auth.uid()
  )
);

create or replace function public.get_shared_calendar(p_slug text, p_require_kiosk boolean default false)
returns table (id uuid, title text, family_name text, share_slug text, is_public boolean, kiosk_enabled boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.title, c.family_name, c.share_slug, c.is_public, c.kiosk_enabled
  from public.family_calendars c
  where c.share_slug = p_slug
    and c.is_public
    and (not p_require_kiosk or c.kiosk_enabled)
  limit 1;
$$;

create or replace function public.get_shared_activities(p_slug text)
returns table (
  id uuid, season_id uuid, title text, date_label text, description text,
  notes text[], locations text[], tags text[], sort_order integer,
  is_favorite boolean, status text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.season_id, a.title, a.date_label, a.description,
         a.notes, a.locations, a.tags, a.sort_order, a.is_favorite, a.status
  from public.family_activities a
  join public.family_calendars c on c.id = a.calendar_id
  where c.share_slug = p_slug and c.is_public and not a.is_hidden
  order by a.sort_order;
$$;

revoke all on function public.get_shared_calendar(text, boolean) from public;
revoke all on function public.get_shared_activities(text) from public;
grant execute on function public.get_shared_calendar(text, boolean) to anon, authenticated;
grant execute on function public.get_shared_activities(text) to anon, authenticated;
