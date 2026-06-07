-- Core Drift schema, indexes, triggers, and RLS policies.
-- Apply manually in Supabase after reviewing against the current production schema.

create extension if not exists pgcrypto;

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  display_name      text,
  bio               text,
  avatar_url        text,
  profile_photos    text[]      not null default '{}',
  interests         text[]      not null default '{}',
  languages         text[]      not null default '{}',
  mood              text        not null default 'exploring',
  travel_mode       boolean     not null default false,
  is_online         boolean     not null default false,
  anonymous_mode    boolean     not null default false,
  current_city      text,
  current_region    text,
  current_country   text,
  location          jsonb,
  latitude          double precision,
  longitude         double precision,
  location_source   text,
  location_updated_at timestamptz,
  instagram_handle  text,
  last_active_at    timestamptz,
  last_seen_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_discovery_idx
  on public.profiles (anonymous_mode, travel_mode, last_seen_at desc);

create index if not exists profiles_last_active_idx
  on public.profiles (last_active_at desc);

create index if not exists profiles_city_idx
  on public.profiles (current_city);

create index if not exists profiles_location_city_idx
  on public.profiles (current_country, current_city);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are visible when public" on public.profiles;
create policy "Profiles are visible when public"
  on public.profiles for select
  using (anonymous_mode = false or auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.touch_profile_activity()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  touched_at timestamptz := now();
begin
  update public.profiles
  set
    last_active_at = touched_at,
    last_seen_at = touched_at,
    is_online = true
  where id = auth.uid();

  return touched_at;
end;
$$;

grant execute on function public.touch_profile_activity() to authenticated;

-- Meetups
create table if not exists public.meetups (
  id             uuid        primary key default gen_random_uuid(),
  creator_id     uuid        not null references public.profiles(id) on delete cascade,
  title          text        not null,
  description    text,
  category       text        not null default 'coffee',
  cover_image_url text,
  location_name  text,
  location       jsonb,
  city           text,
  region         text,
  country        text,
  latitude       double precision,
  longitude      double precision,
  max_attendees  integer     not null default 4,
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint meetups_max_attendees_positive check (max_attendees > 0),
  constraint meetups_title_not_blank check (length(trim(title)) > 0)
);

alter table public.meetups
  add column if not exists cover_image_url text;

alter table public.profiles
  add column if not exists current_region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_source text,
  add column if not exists location_updated_at timestamptz,
  add column if not exists profile_photos text[] not null default '{}';

alter table public.meetups
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists meetups_active_created_idx
  on public.meetups (is_active, created_at desc);

create index if not exists meetups_city_active_idx
  on public.meetups (city, is_active, starts_at);

create index if not exists meetups_location_city_idx
  on public.meetups (country, city, is_active, starts_at);

create index if not exists meetups_creator_idx
  on public.meetups (creator_id);

drop trigger if exists meetups_set_updated_at on public.meetups;
create trigger meetups_set_updated_at
  before update on public.meetups
  for each row execute function public.set_updated_at();

alter table public.meetups enable row level security;

drop policy if exists "Active meetups are visible" on public.meetups;
create policy "Active meetups are visible"
  on public.meetups for select
  using (is_active = true or auth.uid() = creator_id);

drop policy if exists "Users can create own meetups" on public.meetups;
create policy "Users can create own meetups"
  on public.meetups for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can update own meetups" on public.meetups;
create policy "Creators can update own meetups"
  on public.meetups for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Meetup attendees
create table if not exists public.meetup_attendees (
  id          uuid        primary key default gen_random_uuid(),
  meetup_id   uuid        not null references public.meetups(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  status      text        not null default 'confirmed',
  joined_at   timestamptz not null default now(),
  constraint meetup_attendees_unique_user unique (meetup_id, user_id)
);

create index if not exists meetup_attendees_meetup_idx
  on public.meetup_attendees (meetup_id);

create index if not exists meetup_attendees_user_idx
  on public.meetup_attendees (user_id);

alter table public.meetup_attendees enable row level security;

drop policy if exists "Authenticated users can read meetup attendees" on public.meetup_attendees;
create policy "Authenticated users can read meetup attendees"
  on public.meetup_attendees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can join meetups as themselves" on public.meetup_attendees;
create policy "Users can join meetups as themselves"
  on public.meetup_attendees for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave own meetup attendance" on public.meetup_attendees;
create policy "Users can leave own meetup attendance"
  on public.meetup_attendees for delete
  using (auth.uid() = user_id);

-- Saved meetups
create table if not exists public.saved_meetups (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  meetup_id   uuid        not null references public.meetups(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint saved_meetups_unique_user unique (user_id, meetup_id)
);

create index if not exists saved_meetups_user_created_idx
  on public.saved_meetups (user_id, created_at desc);

create index if not exists saved_meetups_meetup_idx
  on public.saved_meetups (meetup_id);

alter table public.saved_meetups enable row level security;

drop policy if exists "Users can read own saved meetups" on public.saved_meetups;
create policy "Users can read own saved meetups"
  on public.saved_meetups for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save meetups as themselves" on public.saved_meetups;
create policy "Users can save meetups as themselves"
  on public.saved_meetups for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unsave own meetups" on public.saved_meetups;
create policy "Users can unsave own meetups"
  on public.saved_meetups for delete
  using (auth.uid() = user_id);

-- Safety: user blocks
create table if not exists public.user_blocks (
  id          uuid        primary key default gen_random_uuid(),
  blocker_id uuid        not null references public.profiles(id) on delete cascade,
  blocked_id uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id),
  constraint user_blocks_unique unique (blocker_id, blocked_id)
);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id, created_at desc);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can read own blocks" on public.user_blocks;
create policy "Users can read own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

drop policy if exists "Users can block as themselves" on public.user_blocks;
create policy "Users can block as themselves"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can delete own blocks" on public.user_blocks;
create policy "Users can delete own blocks"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- Safety: user reports
create table if not exists public.user_reports (
  id          uuid        primary key default gen_random_uuid(),
  reporter_id uuid       not null references public.profiles(id) on delete cascade,
  reported_id uuid       not null references public.profiles(id) on delete cascade,
  reason      text       not null,
  details     text,
  created_at  timestamptz not null default now(),
  constraint user_reports_no_self_report check (reporter_id <> reported_id)
);

create index if not exists user_reports_reporter_idx
  on public.user_reports (reporter_id, created_at desc);

create index if not exists user_reports_reported_idx
  on public.user_reports (reported_id, created_at desc);

alter table public.user_reports enable row level security;

drop policy if exists "Users can report as themselves" on public.user_reports;
create policy "Users can report as themselves"
  on public.user_reports for insert
  with check (auth.uid() = reporter_id);

-- Conversations
create table if not exists public.conversations (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

-- Conversation participants
create table if not exists public.conversation_participants (
  id               uuid        primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.conversations(id) on delete cascade,
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  joined_at        timestamptz not null default now(),
  last_read_at     timestamptz not null default now(),
  constraint conversation_participants_unique_user unique (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id);

create index if not exists conversation_participants_conversation_idx
  on public.conversation_participants (conversation_id);

create or replace function public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select
  using (public.is_conversation_participant(id, auth.uid()));

alter table public.conversation_participants enable row level security;

drop policy if exists "Participants can read conversation participants" on public.conversation_participants;
create policy "Participants can read conversation participants"
  on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));

-- Messages
create table if not exists public.messages (
  id               uuid        primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.conversations(id) on delete cascade,
  sender_id        uuid        not null references public.profiles(id) on delete cascade,
  content          text        not null,
  is_read          boolean     not null default false,
  created_at       timestamptz not null default now(),
  constraint messages_content_not_blank check (length(trim(content)) > 0)
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists messages_unread_idx
  on public.messages (conversation_id, is_read, sender_id);

alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    public.is_conversation_participant(conversation_id, auth.uid())
  );

drop policy if exists "Participants can mark messages read" on public.messages;
create policy "Participants can mark messages read"
  on public.messages for update
  using (public.is_conversation_participant(conversation_id, auth.uid()))
  with check (public.is_conversation_participant(conversation_id, auth.uid()));
