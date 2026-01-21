-- FIX SCRIPT: Resolve medication_history profile_id errors
-- Run this in Supabase SQL Editor

-- 0. Ensure care_profiles table exists (Critical Prerequisite)
create table if not exists public.care_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users on delete cascade not null,
  display_name text not null,
  relationship text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 0b. Clean up zombie medication_history rows (users that no longer exist)
-- This prevents FK violations when trying to erroneously create profiles for them.
delete from public.medication_history
where user_id is null or user_id not in (select id from auth.users);

-- 1. Ensure all users with history have a corresponding 'Me' care profile
insert into public.care_profiles (id, owner_user_id, display_name, relationship, updated_at)
select distinct
  mh.user_id,         -- Use user_id as the care_profile id for the main profile
  mh.user_id,         -- Owner is the user
  'Me',
  'self',
  timezone('utc'::text, now())
from public.medication_history mh
where mh.user_id is not null
  and not exists (
  select 1 from public.care_profiles cp where cp.id = mh.user_id
);

-- 1b. Ensure column profile_id exists (if user ran partial migrations)
alter table public.medication_history
  add column if not exists profile_id uuid references public.care_profiles(id) on delete cascade;

-- 2. Backfill profile_id in medication_history
update public.medication_history
set profile_id = user_id
where profile_id is null
  and user_id in (select id from public.care_profiles);

-- 3. Safety Clean: Delete any history rows where constraints are still impossible to satisfy
delete from public.medication_history
where profile_id is null;

-- 4. Apply the NOT NULL constraint
alter table public.medication_history
  alter column profile_id set not null;

-- 5. Same Logic for Medication Memories
alter table public.memories_medications
  add column if not exists profile_id uuid references public.care_profiles(id) on delete cascade;

delete from public.memories_medications
where user_id is null or user_id not in (select id from auth.users);

update public.memories_medications
set profile_id = user_id
where profile_id is null
  and user_id in (select id from public.care_profiles);

delete from public.memories_medications
where profile_id is null;

alter table public.memories_medications
  alter column profile_id set not null;

select 'Fix applied: Care Profiles & History cleaned and linked.' as status;
