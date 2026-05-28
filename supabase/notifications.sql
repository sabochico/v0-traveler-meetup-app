-- ─── Notifications table ───────────────────────────────────────────────────────
create table if not exists public.notifications (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  type              text        not null,
  title             text        not null,
  body              text        not null,
  read              boolean     not null default false,
  related_user_id   uuid        references auth.users(id) on delete set null,
  related_meetup_id uuid        references public.meetups(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists notifications_user_id_idx      on public.notifications (user_id);
create index if not exists notifications_user_read_idx    on public.notifications (user_id, read);
create index if not exists notifications_created_at_idx   on public.notifications (created_at desc);

-- ─── Row-level security ────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ─── Trigger: notify creator when someone joins their meetup ──────────────────
create or replace function public.handle_meetup_join_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meetup  record;
  v_joiner  record;
begin
  select * into v_meetup from public.meetups where id = NEW.meetup_id;
  select * into v_joiner from public.profiles where id = NEW.user_id;

  -- Skip if creator is joining their own meetup
  if v_meetup.creator_id = NEW.user_id then
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

drop trigger if exists on_meetup_join_notify on public.meetup_attendees;
create trigger on_meetup_join_notify
  after insert on public.meetup_attendees
  for each row execute function public.handle_meetup_join_notification();
