alter table public.family_activities
add column if not exists status text not null default 'planned'
check (status in ('planned', 'completed', 'skipped', 'expired'));
