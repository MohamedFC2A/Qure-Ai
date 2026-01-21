-- ================================================================
-- PRO FEATURES FIX: Private AI Profile + Medication Memories (Ultra)
-- ================================================================
-- Run this file in Supabase SQL Editor.
--
-- Goal:
-- - Private AI Profile (`user_private_profile`) is PRO-only (Ultra)
-- - Medication Memories (`memories_medications`) is PRO-only (Ultra)
-- - Access is enforced by RLS using `profiles.plan` (+ optional `plan_expires_at`)
--
-- Ultra condition:
--   profiles.plan = 'ultra' AND (plan_expires_at IS NULL OR plan_expires_at > now())
-- ================================================================

-- 0) Ensure `profiles.plan_expires_at` exists (safe re-runnable)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'plan_expires_at'
  ) then
    alter table public.profiles add column plan_expires_at timestamp with time zone;
  end if;
end $$;

-- 1) Ensure PRO tables exist (safe re-runnable)
create table if not exists public.user_private_profile (
  user_id uuid references auth.users not null primary key,
  age integer,
  sex text,
  weight text,
  allergies text,
  chronic_conditions text,
  current_medications text,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.memories_medications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  normalized_name text not null,
  display_name text not null,
  count integer default 1,
  first_seen_at timestamp with time zone default timezone('utc'::text, now()),
  last_seen_at timestamp with time zone default timezone('utc'::text, now()),
  metadata jsonb default '{}'::jsonb,
  unique(user_id, normalized_name)
);

alter table public.user_private_profile enable row level security;
alter table public.memories_medications enable row level security;

-- 2) Make sure users can at least read their own profile row (needed for ultra checks in policies)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own profile') then
    create policy "Users can view own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;
end $$;

-- 3) Drop old (non-PRO) policies if present
drop policy if exists "Users manage own private profile" on public.user_private_profile;
drop policy if exists "Ultra users manage own private profile" on public.user_private_profile;

drop policy if exists "Users view own memories" on public.memories_medications;
drop policy if exists "Users delete own memories" on public.memories_medications;
drop policy if exists "Users insert own memories" on public.memories_medications;
drop policy if exists "Users update own memories" on public.memories_medications;
drop policy if exists "Ultra users manage own memories" on public.memories_medications;

-- 4) Create PRO-only policies
create policy "Ultra users manage own private profile"
  on public.user_private_profile
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.plan = 'ultra'
        and (p.plan_expires_at is null or p.plan_expires_at > now())
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.plan = 'ultra'
        and (p.plan_expires_at is null or p.plan_expires_at > now())
    )
  );

create policy "Ultra users manage own memories"
  on public.memories_medications
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.plan = 'ultra'
        and (p.plan_expires_at is null or p.plan_expires_at > now())
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.plan = 'ultra'
        and (p.plan_expires_at is null or p.plan_expires_at > now())
    )
  );

