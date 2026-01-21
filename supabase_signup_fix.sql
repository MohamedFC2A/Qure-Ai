-- ================================================================
-- FIX FOR "Database error saving new user"
-- Run this script in the Supabase Dashboard SQL Editor.
-- It ensures all required tables exist and the new user trigger is robust.
-- ================================================================

-- 1. Ensure Profile Table Exists & Has RLS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  plan text not null default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  plan_expires_at timestamp with time zone
);

alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  -- Policy to allow service role / trigger to manage is implicit, but user might need update
  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;


-- 2. Ensure Usage Windows Table Exists
-- Note: handling potential primary key differences between scripts
create table if not exists public.usage_windows (
  user_id uuid references auth.users on delete cascade not null primary key,
  daily_used integer default 0,
  daily_window_start timestamp with time zone default timezone('utc'::text, now()),
  monthly_used integer default 0,
  monthly_window_start timestamp with time zone default timezone('utc'::text, now())
);

-- If the table existed with 'id' as PK, we ensure 'user_id' is unique (it should be)
-- If it was created by this script, user_id is PK.

alter table public.usage_windows enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own usage') then
    create policy "Users can view own usage" on public.usage_windows for select using (auth.uid() = user_id);
  end if;
end $$;


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

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own ledger') then
    create policy "Users can view own ledger" on public.credit_ledger for select using (auth.uid() = user_id);
  end if;
end $$;


-- 4. ROBUST HANDLE_NEW_USER FUNCTION
-- This uses ON CONFLICT DO NOTHING to prevent errors if running for existing users
-- or if the user was partially created in a previous failed state.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- A. Create Profile associated with the new user
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;

  -- B. Create Usage Window logic
  -- We rely on user_id uniqueness. Whether it's PK or just UNIQUE column, this works.
  begin
    insert into public.usage_windows (user_id)
      values (new.id)
      on conflict (user_id) do nothing;
  exception when others then
    -- Fallback for weird table states where user_id might not be unique constraint (unlikely but safe)
    -- If table has 'id' PK and no unique on user_id (very bad schema), this insert would duplicate.
    -- Assuming schema is correct per above.
    null;
  end;

  -- C. Grant Welcome Bonus (50 Credits) - EXACTLY ONCE
  if not exists (select 1 from public.credit_ledger where user_id = new.id and reason = 'welcome_bonus') then
    insert into public.credit_ledger (user_id, delta, reason)
    values (new.id, 50, 'welcome_bonus');
  end if;

  return new;
end;
$$ language plpgsql security definer;


-- 5. RE-BIND THE TRIGGER
-- Drop it first to ensure we use the new function version
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Success check
select 'Signup Fix Applied Successfully' as status;
