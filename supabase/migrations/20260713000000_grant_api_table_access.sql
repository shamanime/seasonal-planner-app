-- New Supabase projects no longer auto-grant CRUD privileges on public tables.
-- RLS policies remain the authorization boundary for anon and authenticated users.
grant usage on schema public to anon, authenticated, service_role;
grant select,
insert,
update,
delete on all tables in schema public to anon,
authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to service_role;
