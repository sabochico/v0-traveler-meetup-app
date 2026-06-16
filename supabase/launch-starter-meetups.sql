-- Launch meetup cleanup + official starter meetups.
-- Safest usage:
-- 1. Create or rename a dedicated official profile to one of:
--    Drift Team, Drift, Official Drift
-- 2. Run this script in Supabase SQL Editor.
--
-- Affected tables:
-- - public.notifications (meetup-related only)
-- - public.saved_meetups
-- - public.meetup_attendees
-- - public.meetups

begin;

do $$
declare
  official_profile_id uuid;
  base_day timestamptz := date_trunc('day', now());
begin
  select id
  into official_profile_id
  from public.profiles
  where lower(coalesce(display_name, '')) in ('drift team', 'drift', 'official drift')
  order by created_at asc
  limit 1;

  if official_profile_id is null then
    raise exception 'No official Drift profile found. Create a dedicated profile named Drift Team (or Drift / Official Drift) and rerun this script.';
  end if;

  delete from public.notifications
  where related_meetup_id is not null;

  delete from public.saved_meetups
  where meetup_id in (select id from public.meetups);

  delete from public.meetup_attendees
  where meetup_id in (select id from public.meetups);

  delete from public.meetups;

  insert into public.meetups (
    creator_id,
    title,
    description,
    category,
    location_name,
    city,
    region,
    country,
    max_attendees,
    starts_at,
    ends_at,
    is_active,
    cover_image_url
  )
  values
    (
      official_profile_id,
      'Morning Matcha & New Friends',
      'Official Drift starter meetup for an easy morning matcha and relaxed introductions.',
      'coffee',
      'Silver Lake coffee spot',
      'Los Angeles',
      'California',
      'United States',
      6,
      base_day + interval '1 day 17 hours',
      base_day + interval '1 day 19 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Griffith Sunset Walk',
      'Official Drift starter meetup for a golden-hour walk and low-pressure conversation.',
      'exploring',
      'Griffith Observatory',
      'Los Angeles',
      'California',
      'United States',
      8,
      base_day + interval '4 days 1 hours',
      base_day + interval '4 days 3 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Anime Cafe Hangout',
      'Official Drift starter meetup for anime fans who want coffee and an easy first hello.',
      'anime',
      'Little Tokyo cafe',
      'Los Angeles',
      'California',
      'United States',
      6,
      base_day + interval '6 days 18 hours',
      base_day + interval '6 days 20 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Indie Game Night',
      'Official Drift starter meetup for casual co-op games and meeting new people without pressure.',
      'gaming',
      'Arts District gaming lounge',
      'Los Angeles',
      'California',
      'United States',
      8,
      base_day + interval '9 days 2 hours',
      base_day + interval '9 days 5 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Creative Freelancers Meetup',
      'Official Drift starter meetup for freelancers, builders, and creatives to connect while they work.',
      'workspace',
      'Downtown coworking cafe',
      'Los Angeles',
      'California',
      'United States',
      8,
      base_day + interval '12 days 18 hours',
      base_day + interval '12 days 21 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Shibuya Coffee Connections',
      'Official Drift starter meetup for coffee, conversation, and meeting people new to the city.',
      'coffee',
      'Shibuya specialty coffee bar',
      'Tokyo',
      'Tokyo',
      'Japan',
      6,
      base_day + interval '2 days 3 hours',
      base_day + interval '2 days 5 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Akihabara Gaming Meetup',
      'Official Drift starter meetup for casual gaming and easy conversation in Akihabara.',
      'gaming',
      'Akihabara game cafe',
      'Tokyo',
      'Tokyo',
      'Japan',
      8,
      base_day + interval '5 days 5 hours',
      base_day + interval '5 days 8 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Tokyo Night Photo Walk',
      'Official Drift starter meetup for night shots, city lights, and meeting fellow photo lovers.',
      'photography',
      'Shinjuku Station West Exit',
      'Tokyo',
      'Tokyo',
      'Japan',
      8,
      base_day + interval '7 days 10 hours',
      base_day + interval '7 days 12 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Language Exchange Cafe',
      'Official Drift starter meetup for simple conversation swaps and meeting people across cultures.',
      'language exchange',
      'Shimokitazawa cafe',
      'Tokyo',
      'Tokyo',
      'Japan',
      8,
      base_day + interval '10 days 4 hours',
      base_day + interval '10 days 6 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Mahjong & Chill',
      'Official Drift starter meetup for a laid-back table, new faces, and an easy shared activity.',
      'games',
      'Kichijoji board game space',
      'Tokyo',
      'Tokyo',
      'Japan',
      8,
      base_day + interval '13 days 5 hours',
      base_day + interval '13 days 8 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Harbour Coffee Meetup',
      'Official Drift starter meetup for coffee by the harbour and friendly first introductions.',
      'coffee',
      'Circular Quay cafe',
      'Sydney',
      'New South Wales',
      'Australia',
      6,
      base_day + interval '3 days 22 hours',
      base_day + interval '4 days 0 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Bondi Beach Walk',
      'Official Drift starter meetup for a relaxed beach walk and easy conversation.',
      'exploring',
      'Bondi Pavilion',
      'Sydney',
      'New South Wales',
      'Australia',
      8,
      base_day + interval '6 days 22 hours',
      base_day + interval '7 days 0 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Remote Workers Co-Working Session',
      'Official Drift starter meetup for remote workers who want focus, coffee, and new connections.',
      'workspace',
      'Surry Hills coworking cafe',
      'Sydney',
      'New South Wales',
      'Australia',
      10,
      base_day + interval '8 days 23 hours',
      base_day + interval '9 days 2 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Board Games Night',
      'Official Drift starter meetup for social games, small groups, and an easy reason to meet.',
      'games',
      'Newtown board game bar',
      'Sydney',
      'New South Wales',
      'Australia',
      8,
      base_day + interval '11 days 8 hours',
      base_day + interval '11 days 11 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Foodies Meetup',
      'Official Drift starter meetup for trying something good together and meeting fellow food lovers.',
      'food',
      'Haymarket dining spot',
      'Sydney',
      'New South Wales',
      'Australia',
      8,
      base_day + interval '15 days 1 hours',
      base_day + interval '15 days 3 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Coffee & Connections',
      'Official Drift starter meetup for easy coffee conversation and meeting new people in the city.',
      'coffee',
      'Tanjong Pagar cafe',
      'Singapore',
      'Singapore',
      'Singapore',
      6,
      base_day + interval '2 days 1 hours',
      base_day + interval '2 days 3 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Marina Bay Evening Walk',
      'Official Drift starter meetup for a scenic evening walk and low-pressure conversation.',
      'exploring',
      'Marina Bay Sands promenade',
      'Singapore',
      'Singapore',
      'Singapore',
      8,
      base_day + interval '5 days 11 hours',
      base_day + interval '5 days 13 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Study Together Session',
      'Official Drift starter meetup for focused work, study energy, and meeting people quietly.',
      'study',
      'Bugis study cafe',
      'Singapore',
      'Singapore',
      'Singapore',
      10,
      base_day + interval '8 days 2 hours',
      base_day + interval '8 days 5 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Casual Gaming Meetup',
      'Official Drift starter meetup for laid-back gaming and easy new connections.',
      'gaming',
      'Dhoby Ghaut gaming cafe',
      'Singapore',
      'Singapore',
      'Singapore',
      8,
      base_day + interval '12 days 3 hours',
      base_day + interval '12 days 6 hours',
      true,
      null
    ),
    (
      official_profile_id,
      'Hawker Food Adventure',
      'Official Drift starter meetup for sharing hawker favourites and meeting new people naturally.',
      'food',
      'Maxwell Food Centre',
      'Singapore',
      'Singapore',
      'Singapore',
      8,
      base_day + interval '16 days 0 hours',
      base_day + interval '16 days 2 hours',
      true,
      null
    );
end $$;

commit;

select
  count(*) as meetup_count
from public.meetups;

select
  city,
  country,
  count(*) as meetup_count
from public.meetups
group by city, country
order by country, city;
