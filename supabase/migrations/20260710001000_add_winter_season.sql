insert into public.seasons (id, name, emoji, sort_order)
values ('22222222-2222-4222-8222-222222222224', 'Winter', '❄️', 40)
on conflict (name) do update set
  emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.template_activities (
  id, template_id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_featured, is_published
)
values
  (
    '33333333-3333-4333-8333-333333333312',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.seasons where name = 'Winter'),
    'Holiday Lights & Winter Walks',
    'Late November to Early January',
    'Bundle up for an evening walk through seasonal light displays.',
    array['Bring a warm drink and keep the route short for little ones'],
    array['Niagara Falls Winter Festival of Lights', 'Dufferin Islands'],
    array['holiday lights', 'outdoor', 'toddler-friendly'],
    10,
    true,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333313',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.seasons where name = 'Winter'),
    'Outdoor Ice Skating',
    'December to February',
    'Pick a mild winter day for a short skate together.',
    array['Check rink conditions and public skating hours before leaving'],
    array['A local outdoor or community rink'],
    array['outdoor', 'active'],
    20,
    false,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333314',
    '11111111-1111-4111-8111-111111111111',
    (select id from public.seasons where name = 'Winter'),
    'Winter Nature Walk & Hot Chocolate',
    'January to February',
    'Take an easy trail walk, look for animal tracks, and warm up with hot chocolate afterward.',
    array['Choose a short loop and bring extra mittens'],
    array['Dufferin Islands', 'A nearby conservation area'],
    array['outdoor', 'nature', 'toddler-friendly'],
    30,
    false,
    true
  )
on conflict (id) do update set
  season_id = excluded.season_id,
  title = excluded.title,
  date_label = excluded.date_label,
  description = excluded.description,
  notes = excluded.notes,
  locations = excluded.locations,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published;
