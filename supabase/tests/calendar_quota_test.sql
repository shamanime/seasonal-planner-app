begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, created_at, updated_at, aud, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'new-account@example.com', now(), now(), 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aged-account@example.com', now() - interval '2 years 1 day', now(), 'authenticated', 'authenticated');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select calendar_limit from public.get_calendar_quota()),
  3,
  'new accounts receive three calendar slots'
);

insert into public.family_calendars (owner_id, title, share_slug)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Calendar ' || value,
  'new-account-calendar-' || value
from generate_series(1, 3) value;

select is(
  (select calendar_count from public.get_calendar_quota()),
  3::bigint,
  'quota reports the calendars already used'
);

select throws_ok(
  $$insert into public.family_calendars (owner_id, title, share_slug)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Calendar 4', 'new-account-calendar-4')$$,
  'P0001',
  'CALENDAR_LIMIT_REACHED',
  'database rejects calendar creation at the account limit'
);

delete from public.family_calendars where share_slug = 'new-account-calendar-3';
select lives_ok(
  $$insert into public.family_calendars (owner_id, title, share_slug)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Replacement calendar', 'replacement-calendar')$$,
  'deleting a calendar restores an available slot'
);

select is(
  public.calendar_slot_limit('2024-02-29', '2025-02-27'),
  3,
  'a leap-day account does not unlock early'
);
select is(
  public.calendar_slot_limit('2024-02-29', '2025-02-28'),
  4,
  'a leap-day account unlocks on its normalized anniversary'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select is(
  (select calendar_limit from public.get_calendar_quota()),
  5,
  'each completed account anniversary adds one calendar slot'
);

select * from finish();
rollback;
