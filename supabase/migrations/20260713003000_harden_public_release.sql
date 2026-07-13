-- Prevent authenticated users from promoting their own profile to admin.
-- The earlier table-wide UPDATE grant allowed every column to be changed when
-- the owner RLS policy matched; column privileges narrow that grant to the only
-- user-editable profile field.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- The original links used only eight hexadecimal random characters (32 bits),
-- which is too small for a bearer URL containing family information. Rotate
-- those generated links before public release to compact, URL-safe tokens with
-- 96 bits of entropy (12 random bytes encoded as 16 Base64URL characters).
update public.family_calendars
set
    share_slug
    = regexp_replace(share_slug, '-[0-9a-f]{8}$', '')
    || '-'
    || translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_')
where share_slug ~ '-[0-9a-f]{8}$';

-- Bound user-controlled content at the database boundary so direct Data API
-- clients cannot bypass the UI and consume unbounded storage or response size.
alter table public.profiles
add constraint profiles_display_name_length
check (display_name is null or char_length(display_name) <= 100);

alter table public.calendar_templates
add constraint calendar_templates_content_length
check (
    char_length(title) between 1 and 200
    and (description is null or char_length(description) <= 2000)
);

alter table public.seasons
add constraint seasons_content_length
check (
    char_length(name) between 1 and 50
    and (emoji is null or char_length(emoji) <= 16)
);

alter table public.template_activities
add constraint template_activities_content_length
check (
    char_length(title) between 1 and 200
    and (date_label is null or char_length(date_label) <= 100)
    and (description is null or char_length(description) <= 5000)
    and cardinality(notes) <= 25
    and octet_length(array_to_string(notes, '')) <= 10000
    and cardinality(locations) <= 25
    and octet_length(array_to_string(locations, '')) <= 5000
    and cardinality(tags) <= 25
    and octet_length(array_to_string(tags, '')) <= 2500
);

alter table public.family_calendars
add constraint family_calendars_content_length
check (
    char_length(title) between 1 and 200
    and (family_name is null or char_length(family_name) <= 100)
    and char_length(share_slug) between 1 and 128
);

alter table public.family_activities
add constraint family_activities_content_length
check (
    char_length(title) between 1 and 200
    and (date_label is null or char_length(date_label) <= 100)
    and (description is null or char_length(description) <= 5000)
    and cardinality(notes) <= 25
    and octet_length(array_to_string(notes, '')) <= 10000
    and cardinality(locations) <= 25
    and octet_length(array_to_string(locations, '')) <= 5000
    and cardinality(tags) <= 25
    and octet_length(array_to_string(tags, '')) <= 2500
);
