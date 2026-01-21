-- Create profiles table to link to auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  plan text not null default 'free', -- 'free' or 'ultra'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
-- Only service role can update plan for now (or via verified checkout)

-- Credit Ledger (Append-only for audit trail)
create table public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  delta integer not null, -- negative for usage, positive for adding
  reason text not null, -- 'scan', 'daily_reset', 'promo_code', 'purchase'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  request_id text -- idempotency key for API calls
);

-- RLS for ledger
alter table public.credit_ledger enable row level security;
create policy "Users can view own ledger" on public.credit_ledger for select using (auth.uid() = user_id);

-- Usage Windows (Tracks usage for limits)
create table public.usage_windows (
  user_id uuid references auth.users not null primary key,
  daily_used integer default 0,
  daily_window_start timestamp with time zone default timezone('utc'::text, now()),
  monthly_used integer default 0,
  monthly_window_start timestamp with time zone default timezone('utc'::text, now())
);
alter table public.usage_windows enable row level security;
create policy "Users can view own usage" on public.usage_windows for select using (auth.uid() = user_id);

-- Promo Codes
create table public.promo_codes (
  code text primary key,
  credits integer not null,
  expires_at timestamp with time zone,
  max_redemptions integer,
  per_user_limit integer default 1,
  active boolean default true
);
-- No RLS for public read (don't expose list), logic handles validation. Service role reads.

-- Promo Redemptions (Track who used what)
create table public.promo_redemptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  code text references public.promo_codes(code),
  redeemed_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.promo_redemptions enable row level security;
create policy "Users view own redemptions" on public.promo_redemptions for select using (auth.uid() = user_id);

-- Checkout Intents (Persist pending checkouts)
create table public.checkout_intents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  plan text not null,
  status text default 'pending', -- 'pending', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.checkout_intents enable row level security;
create policy "Users view own intents" on public.checkout_intents for select using (auth.uid() = user_id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  
  insert into public.usage_windows (user_id)
  values (new.id);
  
  -- Grant initial credits (Free plan 50) via ledger? Or handled by reset logic?
  -- Let's give initial 50 credits in ledger as 'welcome_bonus'
  insert into public.credit_ledger (user_id, delta, reason)
  values (new.id, 50, 'welcome_bonus');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- (Note: Triggers on auth.users usually require dashboard execution or superuser)
