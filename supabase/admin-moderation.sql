-- Launch-safe admin moderation fields.
-- Apply manually in Supabase before deploying code that filters these columns.

alter table public.profiles
  add column if not exists is_hidden_from_discovery boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_by uuid references auth.users(id) on delete set null,
  add column if not exists ban_reason text;

create index if not exists profiles_discovery_moderation_idx
  on public.profiles (is_hidden_from_discovery, banned_at);
