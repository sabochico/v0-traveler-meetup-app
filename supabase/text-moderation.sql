create or replace function public.drift_text_moderation_is_blocked(value text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized text;
  compact text;
begin
  if value is null or btrim(value) = '' then
    return false;
  end if;

  normalized := lower(value);
  normalized := translate(normalized, '0134@5$7+8!', 'oieaassttbi');
  normalized := regexp_replace(normalized, '[^a-z0-9]+', ' ', 'g');
  normalized := regexp_replace(normalized, '(.)\1{2,}', '\1', 'g');
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');
  compact := regexp_replace(normalized, '\s+', '', 'g');

  return
    normalized ~ '(^| )(nigger|nigga|chink|gook|spic|wetback|kike|raghead|faggot|tranny|shemale|retard)( |$)'
    or compact ~ '(killyourself|gokillyourself|godie|iwillkillyou|imgoingtokillyou|iamgoingtokillyou|rapeyou|heilhitler|whitepower|joinisis)';
end;
$$;

create or replace function public.drift_reject_unsafe_text()
returns trigger
language plpgsql
as $$
declare
  combined_text text;
begin
  if TG_TABLE_NAME = 'messages' then
    combined_text := new.content;
  elsif TG_TABLE_NAME = 'profiles' then
    combined_text := concat_ws(' ', new.display_name, new.bio, new.instagram_handle, new.location, new.current_city, new.current_region, new.current_country);
  elsif TG_TABLE_NAME = 'meetups' then
    combined_text := concat_ws(' ', new.title, new.description, new.location_name, new.city, new.region, new.country);
  elsif TG_TABLE_NAME = 'user_reports' then
    combined_text := concat_ws(' ', new.reason, new.details);
  end if;

  if public.drift_text_moderation_is_blocked(combined_text) then
    raise exception 'Your text contains language that goes against Drift community guidelines. Please edit it and try again.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists reject_unsafe_messages on public.messages;
create trigger reject_unsafe_messages
before insert or update of content on public.messages
for each row execute function public.drift_reject_unsafe_text();

drop trigger if exists reject_unsafe_profiles on public.profiles;
create trigger reject_unsafe_profiles
before insert or update of display_name, bio, instagram_handle, location, current_city, current_region, current_country on public.profiles
for each row execute function public.drift_reject_unsafe_text();

drop trigger if exists reject_unsafe_meetups on public.meetups;
create trigger reject_unsafe_meetups
before insert or update of title, description, location_name, city, region, country on public.meetups
for each row execute function public.drift_reject_unsafe_text();

drop trigger if exists reject_unsafe_user_reports on public.user_reports;
create trigger reject_unsafe_user_reports
before insert or update of reason, details on public.user_reports
for each row execute function public.drift_reject_unsafe_text();

