-- ================================================================
-- FIX: CREATE MISSING 'medication_history' TABLE
-- ================================================================

-- 1. Create the table
create table if not exists public.medication_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  drug_name text not null,
  manufacturer text,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.medication_history enable row level security;

-- 3. Create Policies (Users view/insert their own)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own history') then
        create policy "Users can view own history" on public.medication_history for select using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can insert own history') then
        create policy "Users can insert own history" on public.medication_history for insert with check (auth.uid() = user_id);
    end if;
end $$;

-- 4. Double check RLS for previous fixes
-- Ensure 'updated_at' is handled (optional, but good for consistency)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'medication_history' and column_name = 'updated_at') then
        alter table public.medication_history add column updated_at timestamp with time zone default timezone('utc'::text, now());
    end if;
end $$;
