create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text,
  sort_order integer not null default 0
);

create table if not exists public.template_activities (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.calendar_templates(id) on delete cascade,
  season_id uuid not null references public.seasons(id),
  title text not null,
  date_label text,
  description text,
  notes text[] not null default '{}',
  locations text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.family_calendars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.calendar_templates(id) on delete set null,
  title text not null,
  family_name text,
  share_slug text not null unique,
  is_public boolean not null default true,
  kiosk_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_activities (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.family_calendars(id) on delete cascade,
  source_activity_id uuid references public.template_activities(id) on delete set null,
  season_id uuid not null references public.seasons(id),
  title text not null,
  date_label text,
  description text,
  notes text[] not null default '{}',
  locations text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_family_calendars_updated_at on public.family_calendars;
create trigger set_family_calendars_updated_at
before update on public.family_calendars
for each row execute function public.set_updated_at();

drop trigger if exists set_family_activities_updated_at on public.family_activities;
create trigger set_family_activities_updated_at
before update on public.family_activities
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.calendar_templates enable row level security;
alter table public.seasons enable row level security;
alter table public.template_activities enable row level security;
alter table public.family_calendars enable row level security;
alter table public.family_activities enable row level security;

drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Published templates are public" on public.calendar_templates;
create policy "Published templates are public"
on public.calendar_templates for select
using (is_published or public.is_admin());

drop policy if exists "Admins manage templates" on public.calendar_templates;
create policy "Admins manage templates"
on public.calendar_templates for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Seasons are public" on public.seasons;
create policy "Seasons are public"
on public.seasons for select
using (true);

drop policy if exists "Admins manage seasons" on public.seasons;
create policy "Admins manage seasons"
on public.seasons for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Published activities are public" on public.template_activities;
create policy "Published activities are public"
on public.template_activities for select
using (
  (is_published and exists (
    select 1 from public.calendar_templates
    where calendar_templates.id = template_activities.template_id
    and calendar_templates.is_published
  ))
  or public.is_admin()
);

drop policy if exists "Admins manage template activities" on public.template_activities;
create policy "Admins manage template activities"
on public.template_activities for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Calendars readable by owner or share link" on public.family_calendars;
create policy "Calendars readable by owner or share link"
on public.family_calendars for select
using (owner_id = auth.uid() or is_public or public.is_admin());

drop policy if exists "Users create own calendars" on public.family_calendars;
create policy "Users create own calendars"
on public.family_calendars for insert
with check (owner_id = auth.uid());

drop policy if exists "Owners update calendars" on public.family_calendars;
create policy "Owners update calendars"
on public.family_calendars for update
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners delete calendars" on public.family_calendars;
create policy "Owners delete calendars"
on public.family_calendars for delete
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Activities readable through calendar" on public.family_activities;
create policy "Activities readable through calendar"
on public.family_activities for select
using (
  exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
    and (family_calendars.owner_id = auth.uid() or family_calendars.is_public or public.is_admin())
  )
);

drop policy if exists "Owners create activities" on public.family_activities;
create policy "Owners create activities"
on public.family_activities for insert
with check (
  exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
    and family_calendars.owner_id = auth.uid()
  )
);

drop policy if exists "Owners update activities" on public.family_activities;
create policy "Owners update activities"
on public.family_activities for update
using (
  public.is_admin() or exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
    and family_calendars.owner_id = auth.uid()
  )
)
with check (
  public.is_admin() or exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
    and family_calendars.owner_id = auth.uid()
  )
);

drop policy if exists "Owners delete activities" on public.family_activities;
create policy "Owners delete activities"
on public.family_activities for delete
using (
  public.is_admin() or exists (
    select 1 from public.family_calendars
    where family_calendars.id = family_activities.calendar_id
    and family_calendars.owner_id = auth.uid()
  )
);

insert into public.calendar_templates (id, title, description, is_published)
values (
  '11111111-1111-4111-8111-111111111111',
  'Family Activity Calendar',
  'A seasonal Niagara family activity calendar for easy toddler-friendly outings.',
  true
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  is_published = excluded.is_published;

insert into public.seasons (id, name, emoji, sort_order)
values
  ('22222222-2222-4222-8222-222222222221', 'Spring', '🌱', 10),
  ('22222222-2222-4222-8222-222222222222', 'Summer', '☀️', 20),
  ('22222222-2222-4222-8222-222222222223', 'Fall', '🍂', 30)
on conflict (name) do update set
  emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.template_activities (
  id, template_id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_featured, is_published
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'Maple Sugar Bush Season',
    'Late Feb to Mid April',
    'Maple syrup tours, taffy on snow, and a short forest walk.',
    array['Best time: March', 'Closer to Niagara; easier with a toddler'],
    array['White Meadows Farms (St. Catharines)'],
    array['outdoor', 'toddler-friendly'],
    10,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'Orchard Bloom Drives + Spring Flowers',
    'Late April to Early May',
    'Bloom timing changes weekly; stay flexible.',
    array['Great for stroller walks and photos'],
    array['Vineland / Beamsville / NOTL blossom drive', 'Niagara Parks Floral Showhouse (Niagara Falls)'],
    array['flowers', 'stroller-friendly'],
    20,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'Tulip Season (U-Pick + Displays)',
    'Early May to Late May',
    'Best spring visual outing with friends.',
    array['Carrier is easier than stroller if fields are muddy'],
    array['TASC Tulip Festival (NOTL)', 'JP Niagara Tulip Experience (Pelham)'],
    array['flowers', 'u-pick'],
    30,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'Farmers Markets (weekly)',
    'Late May to October',
    'Fresh food, snacks, and a casual outing.',
    array['Best for easy mornings with a toddler'],
    array['The Market at the Village (NOTL)', 'St. Catharines Farmers'' Market'],
    array['food', 'weekly'],
    40,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Strawberry Picking (U-Pick)',
    'Mid June to Early July',
    'Easy for toddlers because the plants are low.',
    array['Short visits: 30-60 minutes', 'Go early before it gets hot'],
    array['Fenwick Berry Farm (Pelham)', 'DeVries Fruit Farm (Fenwick)'],
    array['u-pick', 'best'],
    10,
    true,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Cherry Picking',
    'Late June to Mid July',
    'Slightly harder because of trees, but still doable.',
    array['Often overlaps with strawberries'],
    array['Parkway Orchards (Niagara-on-the-Lake)'],
    array['u-pick'],
    20,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333307',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Peach Season (U-Pick + Stands)',
    'Late July to August',
    'A very local Niagara highlight.',
    array['Pre-picked is easier if nap timing is tight'],
    array['Dutchyn Farms (Niagara-on-the-Lake)', 'Hildreth Farm Market (Lincoln)'],
    array['u-pick', 'farm stands'],
    30,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333308',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Peach Festival',
    'Early/Mid August',
    'Food, music, and family activities.',
    array['Best as a daytime stroll with snacks'],
    array['Simcoe Park, NOTL'],
    array['festival', 'food'],
    40,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333309',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    'Pear & Apple Picking',
    'September to Early October',
    'Apples are easiest and most fun.',
    array['Go early for cooler temperatures and easier parking'],
    array['Parkway Orchards (Niagara-on-the-Lake)', 'Dutchyn Farms (Niagara-on-the-Lake)'],
    array['u-pick', 'fall'],
    10,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333310',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    'Pumpkin Patches & Fall Farms',
    'September to October',
    'Hayrides, corn maze, farm market, and a good mix of toddler play plus adult snacks.',
    array['Must-do fall outing'],
    array['Murphy''s Country Produce (Binbrook)'],
    array['must-do', 'fall farm'],
    20,
    true,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333311',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    'Grape & Wine Festival',
    'September',
    'Best with adult friends; do daytime only with a toddler.',
    array['Multi-week event'],
    array['Montebello Park, St. Catharines'],
    array['festival', 'adults'],
    30,
    false,
    true
  )
on conflict (id) do update set
  title = excluded.title,
  date_label = excluded.date_label,
  description = excluded.description,
  notes = excluded.notes,
  locations = excluded.locations,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published;
