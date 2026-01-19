-- MEDVISION AI - COMPLETE SUPABASE SETUP SCRIPT
-- Copy and paste this ENTIRE file into your Supabase SQL Editor and run it.

-- 1. Create Tables
create table if not exists public.medication_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  drug_name text not null,
  manufacturer text,
  analysis_json jsonb not null,
  user_id uuid references auth.users(id)
);

create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  key_label text not null,
  api_key text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- 2. Enable Security (RLS)
alter table public.medication_history enable row level security;
alter table public.api_keys enable row level security;

-- 3. Clean up old/insecure policies (to prevent duplicates or conflicts)
drop policy if exists "Allow all inserts" on public.medication_history;
drop policy if exists "Allow public read" on public.medication_history;
drop policy if exists "Users can insert their own scans" on public.medication_history;
drop policy if exists "Users can view their own scans" on public.medication_history;
drop policy if exists "Users can view their own keys" on public.api_keys;
drop policy if exists "Users can insert their own keys" on public.api_keys;
drop policy if exists "Users can delete their own keys" on public.api_keys;

-- 4. Create PROPER Secure Policies

-- Medication History: Only User X can see/insert User X's data
create policy "Users can insert their own scans"
  on public.medication_history for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own scans"
  on public.medication_history for select
  using (auth.uid() = user_id);

-- API Keys: Only User X can see/manage User X's keys
create policy "Users can view their own keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- 5. Helper Function for API Key Validation (Bypasses RLS safely)
create or replace function verify_api_key(key_text text)
returns jsonb
language plpgsql
security definer
as $$
declare
  found_key record;
begin
  select * into found_key from public.api_keys where api_key = key_text limit 1;
  
  if found_key.id is null then
    return null;
  else
    return json_build_object(
      'id', found_key.id,
      'user_id', found_key.user_id,
      'key_label', found_key.key_label
    );
  end if;
end;
$$;
