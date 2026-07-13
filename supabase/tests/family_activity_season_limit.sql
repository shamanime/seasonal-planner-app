begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'season-limit@example.com');

insert into public.family_calendars (id, owner_id, title, share_slug)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Limit test calendar',
  'limit-test-calendar'
);

insert into public.family_activities (calendar_id, season_id, title, sort_order)
select
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '22222222-2222-4222-8222-222222222221',
  'Activity ' || number,
  number
from generate_series(1, 15) as number;

select is(
  (
    select count(*)::integer
    from public.family_activities
    where calendar_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and season_id = '22222222-2222-4222-8222-222222222221'
  ),
  15,
  'allows 15 activities in a season'
);

select throws_ok(
  $$
    insert into public.family_activities (calendar_id, season_id, title)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '22222222-2222-4222-8222-222222222221',
      'Activity 16'
    )
  $$,
  '23514',
  'A season can have at most 15 activities.',
  'rejects a 16th activity in the same season'
);

select lives_ok(
  $$
    insert into public.family_activities (calendar_id, season_id, title)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '22222222-2222-4222-8222-222222222222',
      'Summer activity'
    )
  $$,
  'allows an activity in another season'
);

select lives_ok(
  $$
    update public.family_activities
    set title = 'Renamed activity'
    where calendar_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and season_id = '22222222-2222-4222-8222-222222222221'
      and sort_order = 1
  $$,
  'allows updates that do not change an activity season'
);

select * from finish();
rollback;
