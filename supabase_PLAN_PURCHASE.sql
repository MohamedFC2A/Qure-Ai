-- ================================================================
-- PHASE 2: PLAN SUBSCRIPTION & PROFILES SYSTEM
-- Run this script to enable "Buying Plans with Credits"
-- ================================================================

-- 1. Ensure PROFILES, LEDGER, and CODES tables exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free',
  plan_expires_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Credit Ledger
create table if not exists public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  delta integer not null,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  request_id text
);

-- Top-up Codes
create table if not exists public.topup_codes (
  code text primary key,
  credits integer not null,
  active boolean not null default true,
  expires_at timestamp with time zone,
  redeemed_by uuid references auth.users,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.topup_codes enable row level security;


-- Policies for Profiles
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
        create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can update own profile.') then
        create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);
    end if;
end $$;

-- 2. Trigger to automatically create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on recreation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. THE PURCHASE FUNCTION (Atomically Trade Credits for Plan)
-- Cost: 2000 Credits = 30 Days of Ultra
create or replace function public.purchase_ultra_plan(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_cost int := 2000; -- COST OF ULTRA PLAN
  v_balance int;
  v_current_plan text;
begin
  -- 1. Calculate Current Balance (Plan limit + Extra)
  -- Simplified: We just sum the ledger.
  -- NOTE: This assumes 'credit_ledger' is the source of spendable currency.
  select coalesce(sum(delta), 0) into v_balance from public.credit_ledger where user_id = p_user_id;

  if v_balance < v_cost then
    return jsonb_build_object('success', false, 'error', 'Insufficient credits. You need ' || v_cost);
  end if;

  -- 2. Deduct Credits
  insert into public.credit_ledger (user_id, delta, reason, metadata)
  values (p_user_id, -v_cost, 'plan_purchase', jsonb_build_object('plan', 'ultra', 'duration', '30 days'));

  -- 3. Update Profile
  update public.profiles
  set plan = 'ultra',
      plan_expires_at = (case 
                          when plan_expires_at > now() then plan_expires_at + interval '30 days' 
                          else now() + interval '30 days' 
                         end)
  where id = p_user_id;

  return jsonb_build_object('success', true, 'message', 'Upgraded to Ultra for 30 days');
end;
$$;



-- 3.b. REDEEM TOP-UP CODE FUNCTION
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


-- 4. GENERATE 50 BULK CODES (Mixed Values)
-- 20 Codes of 500 Credits
do $$
declare i int; c text;
begin
  for i in 1..20 loop
    c := substr(md5(random()::text), 1, 10); -- simple random string
    insert into public.topup_codes (code, credits) values (upper(c), 500) on conflict do nothing;
  end loop;
end $$;

-- 10 Codes of 1000 Credits
do $$
declare i int; c text;
begin
  for i in 1..10 loop
    c := substr(md5(random()::text), 1, 10);
    insert into public.topup_codes (code, credits) values ('GOLD-' || upper(c), 1000) on conflict do nothing;
  end loop;
end $$;

-- 5 Codes of 2500 Credits (Enough for Ultra)
do $$
declare i int; c text;
begin
  for i in 1..5 loop
    c := substr(md5(random()::text), 1, 10);
    insert into public.topup_codes (code, credits) values ('ULTRA-' || upper(c), 2500) on conflict do nothing;
  end loop;
end $$;

select count(*) as new_codes_generated from public.topup_codes;
