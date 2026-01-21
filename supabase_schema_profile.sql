-- ================================================================
-- FINAL MIGRATION: PROFILE & SIGNUP FIXES
-- Run this script in the Supabase Dashboard SQL Editor.
-- It applies all schema changes for the new profile system and ensures the signup trigger is robust.
-- ================================================================
--
-- Includes:
-- - Family/Caregiver Mode (Ultra): Sub-profiles per account
-- - Per-profile Private AI Context (Ultra)
-- - Per-profile Medication Memories + History separation (profile_id)
-- ================================================================

-- 1. Ensure Profile Table Exists & Has All Columns
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  plan text not null default 'free',
  username text,
  full_name text,
  gender text,
  age integer,
  height text,
  weight text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  plan_expires_at timestamp with time zone
);

-- Ensure columns exist (safe to run multiple times)
alter table public.profiles
  add column if not exists email text,
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists gender text,
  add column if not exists age integer,
  add column if not exists height text,
  add column if not exists weight text;

alter table public.profiles enable row level security;

-- Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);


-- 1b. Helper: Ultra plan check (used in RLS policies)
create or replace function public.is_ultra_user(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_uid
      and p.plan = 'ultra'
      and (p.plan_expires_at is null or p.plan_expires_at > now())
  );
$$;


-- 1c. Family/Caregiver Mode: Care Profiles (Sub-profiles)
create table if not exists public.care_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users on delete cascade not null,
  display_name text not null,
  relationship text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.care_profiles enable row level security;

drop policy if exists "Users view own care profiles" on public.care_profiles;
create policy "Users view own care profiles"
  on public.care_profiles
  for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Ultra users insert care profiles" on public.care_profiles;
create policy "Ultra users insert care profiles"
  on public.care_profiles
  for insert
  with check (
    auth.uid() = owner_user_id
    and public.is_ultra_user(auth.uid())
  );

drop policy if exists "Ultra users update care profiles" on public.care_profiles;
create policy "Ultra users update care profiles"
  on public.care_profiles
  for update
  using (
    auth.uid() = owner_user_id
    and public.is_ultra_user(auth.uid())
  )
  with check (
    auth.uid() = owner_user_id
    and public.is_ultra_user(auth.uid())
  );

drop policy if exists "Ultra users delete care profiles" on public.care_profiles;
create policy "Ultra users delete care profiles"
  on public.care_profiles
  for delete
  using (
    auth.uid() = owner_user_id
    and public.is_ultra_user(auth.uid())
    and id <> auth.uid() -- protect the self-profile
  );

-- Backfill self-profile rows for existing users (safe to re-run)
insert into public.care_profiles (id, owner_user_id, display_name, relationship)
select
  p.id,
  p.id,
  coalesce(nullif(p.username, ''), nullif(split_part(p.email, '@', 1), ''), 'Me'),
  'self'
from public.profiles p
where not exists (select 1 from public.care_profiles cp where cp.id = p.id);


-- 1d. Per-profile Private AI Context (Ultra)
create table if not exists public.care_private_profiles (
  profile_id uuid references public.care_profiles(id) on delete cascade primary key,
  age integer,
  sex text,
  height text,
  weight text,
  allergies text,
  chronic_conditions text,
  current_medications text,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.care_private_profiles enable row level security;

drop policy if exists "Ultra users manage own care private profiles" on public.care_private_profiles;
create policy "Ultra users manage own care private profiles"
  on public.care_private_profiles
  for all
  using (
    public.is_ultra_user(auth.uid())
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  )
  with check (
    public.is_ultra_user(auth.uid())
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  );


-- 2. Ensure Usage Windows Table Exists
create table if not exists public.usage_windows (
  user_id uuid references auth.users on delete cascade not null primary key,
  daily_used integer default 0,
  daily_window_start timestamp with time zone default timezone('utc'::text, now()),
  monthly_used integer default 0,
  monthly_window_start timestamp with time zone default timezone('utc'::text, now())
);

alter table public.usage_windows enable row level security;

drop policy if exists "Users can view own usage" on public.usage_windows;
create policy "Users can view own usage" on public.usage_windows for select using (auth.uid() = user_id);


-- 3. Ensure Credit Ledger Exists
create table if not exists public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  delta integer not null,
  reason text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  request_id text
);

alter table public.credit_ledger enable row level security;

drop policy if exists "Users can view own ledger" on public.credit_ledger;
create policy "Users can view own ledger" on public.credit_ledger for select using (auth.uid() = user_id);


-- 3b. Medication History (per-profile separation via profile_id)
create table if not exists public.medication_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  profile_id uuid references public.care_profiles(id) on delete cascade not null,
  drug_name text not null,
  manufacturer text,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.medication_history enable row level security;

-- Ensure profile_id exists + backfill for existing rows
alter table public.medication_history
  add column if not exists profile_id uuid references public.care_profiles(id) on delete cascade;

update public.medication_history
set profile_id = user_id
where profile_id is null;

alter table public.medication_history
  alter column profile_id set not null;

-- Policies: user sees/inserts only their own history and only into their own care profiles
drop policy if exists "Users can view own history" on public.medication_history;
create policy "Users can view own history"
  on public.medication_history
  for select
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own history" on public.medication_history;
create policy "Users can insert own history"
  on public.medication_history
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  );

create index if not exists idx_medication_history_user_profile_created_at
  on public.medication_history (user_id, profile_id, created_at);


-- 3c. Medication Memories (Ultra-only, per-profile separation via profile_id)
create table if not exists public.memories_medications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  profile_id uuid references public.care_profiles(id) on delete cascade not null,
  normalized_name text not null,
  display_name text not null,
  count integer default 1,
  first_seen_at timestamp with time zone default timezone('utc'::text, now()),
  last_seen_at timestamp with time zone default timezone('utc'::text, now()),
  metadata jsonb default '{}'::jsonb,
  unique(user_id, profile_id, normalized_name)
);

alter table public.memories_medications enable row level security;

-- Ensure profile_id exists + backfill for existing rows
alter table public.memories_medications
  add column if not exists profile_id uuid references public.care_profiles(id) on delete cascade;

update public.memories_medications
set profile_id = user_id
where profile_id is null;

alter table public.memories_medications
  alter column profile_id set not null;

-- Replace legacy unique constraint (user_id, normalized_name) -> (user_id, profile_id, normalized_name)
alter table public.memories_medications
  drop constraint if exists memories_medications_user_id_normalized_name_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memories_medications_user_profile_normalized_key'
  ) then
    alter table public.memories_medications
      add constraint memories_medications_user_profile_normalized_key
      unique (user_id, profile_id, normalized_name);
  end if;
end $$;

-- Policies (Ultra-only)
drop policy if exists "Ultra users manage own memories" on public.memories_medications;
drop policy if exists "Users view own memories" on public.memories_medications;
drop policy if exists "Users delete own memories" on public.memories_medications;
drop policy if exists "Users insert own memories" on public.memories_medications;
drop policy if exists "Users update own memories" on public.memories_medications;
drop policy if exists "Users manage own memories" on public.memories_medications;

create policy "Ultra users manage own memories"
  on public.memories_medications
  for all
  using (
    auth.uid() = user_id
    and public.is_ultra_user(auth.uid())
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and public.is_ultra_user(auth.uid())
    and exists (
      select 1
      from public.care_profiles cp
      where cp.id = profile_id
        and cp.owner_user_id = auth.uid()
    )
  );

create index if not exists idx_memories_medications_user_profile_last_seen
  on public.memories_medications (user_id, profile_id, last_seen_at);


-- 4. ROBUST HANDLE_NEW_USER FUNCTION
-- Parses metadata (age, gender, etc.) and handles unique username conflicts.
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  v_username text;
  v_gender text;
  v_age int;
  v_height text;
  v_weight text;
  v_display_name text;
begin
  -- 1. Parse Username
  v_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if v_username is not null then
    -- Sanitize
    v_username := regexp_replace(v_username, '[^a-zA-Z0-9_]+', '', 'g');
    if length(v_username) < 3 then
      v_username := null;
    end if;

    -- Handle uniqueness collision by appending random string if needed
    if exists (
      select 1
      from public.profiles p
      where p.username is not null
        and lower(p.username) = lower(v_username)
    ) then
      v_username := left(v_username, 20) || '_' || substr(new.id::text, 1, 6);
    end if;
  end if;

  -- 2. Parse Gender
  v_gender := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'gender', new.raw_user_meta_data->>'sex', ''))), '');
  if v_gender not in ('male', 'female', 'other') then
    v_gender := null;
  end if;

  -- 3. Parse Age
  v_age := null;
  if coalesce(new.raw_user_meta_data->>'age', '') ~ '^[0-9]{1,3}$' then
    v_age := (new.raw_user_meta_data->>'age')::int;
  end if;

  -- 4. Parse Height/Weight
  v_height := nullif(trim(coalesce(new.raw_user_meta_data->>'height', '')), '');
  v_weight := nullif(trim(coalesce(new.raw_user_meta_data->>'weight', '')), '');
  v_display_name := coalesce(v_username, nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Me');

  -- A. Insert Profile
  begin
    insert into public.profiles (id, email, plan, username, full_name, gender, age, height, weight, updated_at)
    values (
      new.id,
      new.email,
      'free',
      v_username,
      nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
      v_gender,
      v_age,
      v_height,
      v_weight,
      timezone('utc'::text, now())
    )
    on conflict (id) do update set
      email = coalesce(public.profiles.email, excluded.email),
      username = coalesce(public.profiles.username, excluded.username),
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      gender = coalesce(public.profiles.gender, excluded.gender),
      age = coalesce(public.profiles.age, excluded.age),
      height = coalesce(public.profiles.height, excluded.height),
      weight = coalesce(public.profiles.weight, excluded.weight),
      updated_at = timezone('utc'::text, now());
  exception when unique_violation then
    -- Retry without username if it somehow caused a collision race condition
    insert into public.profiles (id, email, plan, full_name, gender, age, height, weight, updated_at)
    values (
      new.id,
      new.email,
      'free',
      nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
      v_gender,
      v_age,
      v_height,
      v_weight,
      timezone('utc'::text, now())
    )
    on conflict (id) do update set
      email = coalesce(public.profiles.email, excluded.email),
      updated_at = timezone('utc'::text, now());
  end;

  -- A2. Ensure self care-profile row exists (id = user id)
  insert into public.care_profiles (id, owner_user_id, display_name, relationship, updated_at)
  values (new.id, new.id, v_display_name, 'self', timezone('utc'::text, now()))
  on conflict (id) do update set
    display_name = coalesce(public.care_profiles.display_name, excluded.display_name),
    updated_at = timezone('utc'::text, now());

  -- B. Insert Usage Window
  begin
    insert into public.usage_windows (user_id)
      values (new.id)
      on conflict (user_id) do nothing;
  exception when others then null;
  end;

  -- C. Welcome Bonus (50 Credits)
  if not exists (select 1 from public.credit_ledger where user_id = new.id and reason = 'welcome_bonus') then
    insert into public.credit_ledger (user_id, delta, reason)
    values (new.id, 50, 'welcome_bonus');
  end if;

  return new;
end;
$$ language plpgsql security definer;


-- 5. RE-BIND THE TRIGGER
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Success check
select 'Signup Schema Updated Successfully' as status;
