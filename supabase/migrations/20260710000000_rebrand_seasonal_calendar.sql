update public.calendar_templates
set
  title = case
    when title = 'Family Activity Calendar' then 'Seasonal Activity Calendar'
    else title
  end,
  description = case
    when description = 'A seasonal Niagara family activity calendar for easy toddler-friendly outings.'
      then 'A customizable seasonal activity calendar for family outings, traditions, and time together.'
    else description
  end
where id = '11111111-1111-4111-8111-111111111111';
