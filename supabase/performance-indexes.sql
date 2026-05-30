-- Drift production performance indexes.
-- Apply manually in Supabase SQL editor after reviewing against production.
-- Safe to rerun: every index uses "if not exists".

-- Profiles: Discover people and nearby active profiles.
create index if not exists profiles_discovery_idx
  on public.profiles (anonymous_mode, travel_mode, last_seen_at desc);

create index if not exists profiles_city_idx
  on public.profiles (current_city);

-- Meetups: active feeds, city filtering, creator lookups.
create index if not exists meetups_active_created_idx
  on public.meetups (is_active, created_at desc);

create index if not exists meetups_city_active_idx
  on public.meetups (city, is_active, starts_at);

create index if not exists meetups_creator_idx
  on public.meetups (creator_id);

-- Meetup attendees: join/leave checks and attendee counts.
create index if not exists meetup_attendees_meetup_idx
  on public.meetup_attendees (meetup_id);

create index if not exists meetup_attendees_user_idx
  on public.meetup_attendees (user_id);

-- Saved meetups: saved tab and save/unsave checks.
create index if not exists saved_meetups_user_created_idx
  on public.saved_meetups (user_id, created_at desc);

create index if not exists saved_meetups_meetup_idx
  on public.saved_meetups (meetup_id);

-- Conversations: conversation list lookup.
create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id);

create index if not exists conversation_participants_conversation_idx
  on public.conversation_participants (conversation_id);

-- Messages: chat history, latest message, unread counts.
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists messages_unread_idx
  on public.messages (conversation_id, is_read, sender_id);

-- Notifications: bell list and unread count.
create index if not exists notifications_user_id_idx
  on public.notifications (user_id);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

-- Verification helper: run after applying to confirm expected indexes exist.
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'profiles_discovery_idx',
    'profiles_city_idx',
    'meetups_active_created_idx',
    'meetups_city_active_idx',
    'meetups_creator_idx',
    'meetup_attendees_meetup_idx',
    'meetup_attendees_user_idx',
    'saved_meetups_user_created_idx',
    'saved_meetups_meetup_idx',
    'conversation_participants_user_idx',
    'conversation_participants_conversation_idx',
    'messages_conversation_created_idx',
    'messages_unread_idx',
    'notifications_user_id_idx',
    'notifications_user_read_idx',
    'notifications_created_at_idx'
  )
order by tablename, indexname;
