alter table public.conversations
  add column if not exists meetup_id uuid references public.meetups(id) on delete set null;

create index if not exists conversations_meetup_idx
  on public.conversations (meetup_id);
