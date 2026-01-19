-- Create a table for storing medication analysis history
create table public.medication_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  drug_name text not null,
  manufacturer text,
  analysis_json jsonb not null, -- Stores the full AI analysis (dosage, side effects, etc.)
  user_id uuid references auth.users(id) -- Optional: invalid if auth not strictly enforced yet, but good practice
);

-- Enable Row Level Security (RLS)
alter table public.medication_history enable row level security;

-- Policy: Allow anonymous inserts (for now, or authenticated if user system is active)
-- Adjust 'true' to 'auth.uid() = user_id' if you require login.
create policy "Allow all inserts"
  on public.medication_history for insert
  with check (true);

-- Policy: Allow reading own data (or all for demo/admin)
create policy "Allow public read"
  on public.medication_history for select
  using (true);

-- API Keys Management
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  key_label text not null,
  api_key text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

alter table public.api_keys enable row level security;

create policy "Users can view their own keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- RPC Function to securely verify API keys (Bypasses RLS)
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
