begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'profile-privileges@example.com');

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'authenticated users cannot update the profile role'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'),
  'authenticated users can update their display name'
);

select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$update public.profiles
    set display_name = 'Safe display name'
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  'the permitted profile field remains editable'
);

select throws_ok(
  $$update public.profiles
    set role = 'admin'
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  '42501',
  'permission denied for table profiles',
  'an authenticated user cannot promote their account to admin'
);

select * from finish();
rollback;
