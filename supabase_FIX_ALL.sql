-- ================================================================
-- FINAL FIX SCRIPT: Run this ENTIRE file in Supabase SQL Editor
-- This will fix the 500 Error by creating all missing tables & functions.
-- ================================================================

-- 1. Create Credit Ledger (Stores history of transactions)
create table if not exists public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  delta integer not null, -- can be positive (add) or negative (spend)
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  request_id text -- for idempotency
);

-- 2. Create Top-up Codes (Stores the voucher codes)
create table if not exists public.topup_codes (
  code text primary key,
  credits integer not null,
  active boolean not null default true,
  expires_at timestamp with time zone,
  redeemed_by uuid references auth.users,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Usage Windows (For plan limits)
create table if not exists public.usage_windows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  daily_used integer default 0,
  daily_window_start timestamp with time zone default timezone('utc'::text, now()),
  monthly_used integer default 0,
  monthly_window_start timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create PRO Features tables
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

-- 5. ENABLE Row Level Security (RLS) - Basic policies
alter table public.credit_ledger enable row level security;
alter table public.topup_codes enable row level security;
alter table public.usage_windows enable row level security;
alter table public.user_private_profile enable row level security;
alter table public.memories_medications enable row level security;

-- (Safe Re-runnable Policies)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users view own ledger') then
        create policy "Users view own ledger" on public.credit_ledger for select using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users manage own private profile') then
        create policy "Users manage own private profile" on public.user_private_profile for all using (auth.uid() = user_id);
    end if;
end $$;

-- 6. THE CRITICAL FIX: The Redemption Function (RPC)
-- This allows the API to safely redeem a code.
create or replace function public.redeem_topup_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer -- Runs with admin privileges to update code status
as $$
declare
  v_credits int;
  v_already_redeemed_by uuid;
begin
  -- Check if code exists
  select redeemed_by into v_already_redeemed_by from public.topup_codes where code = p_code;
  
  if v_already_redeemed_by is not null then
     return jsonb_build_object('success', false, 'error', 'Code already redeemed');
  end if;

  -- Attempt Update
  update public.topup_codes
  set redeemed_by = p_user_id,
      redeemed_at = now(),
      active = false
  where code = p_code
    and active = true
    and redeemed_at is null
  returning credits into v_credits;

  -- Handle Failure
  if v_credits is null then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  end if;

  -- Log Transaction
  insert into public.credit_ledger (user_id, delta, reason, metadata, request_id)
  values (p_user_id, v_credits, 'topup_code', jsonb_build_object('code', p_code), 'req_' || p_code);

  return jsonb_build_object('success', true, 'credits_added', v_credits);
end;
$$;

-- 7. GENERATE TEST CODES
-- Insert a test code '12345' (500 Credits) if not exists
insert into public.topup_codes (code, credits, active)
values ('12345', 500, true)
on conflict (code) do nothing;

insert into public.topup_codes (code, credits, active)
values ('FREE100', 100, true)
on conflict (code) do nothing;
