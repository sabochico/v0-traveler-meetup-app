alter table public.profiles
  add column if not exists notification_preferences jsonb not null
  default '{"messages":true,"meetup_requests":true,"likes":false,"nearby":true,"sounds":true}'::jsonb;

create or replace function public.handle_meetup_join_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meetup  record;
  v_joiner  record;
  v_meetup_requests_enabled boolean := true;
begin
  select * into v_meetup from public.meetups where id = NEW.meetup_id;
  select * into v_joiner from public.profiles where id = NEW.user_id;

  if v_meetup.creator_id = NEW.user_id then
    return NEW;
  end if;

  select coalesce((p.notification_preferences->>'meetup_requests')::boolean, true)
  into v_meetup_requests_enabled
  from public.profiles p
  where p.id = v_meetup.creator_id;

  if coalesce(v_meetup_requests_enabled, true) = false then
    return NEW;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    related_user_id,
    related_meetup_id
  ) values (
    v_meetup.creator_id,
    'meetup_join',
    'Someone joined your meetup!',
    coalesce(v_joiner.display_name, 'Someone') || ' joined "' || v_meetup.title || '"',
    NEW.user_id,
    NEW.meetup_id
  );

  return NEW;
end;
$$;
