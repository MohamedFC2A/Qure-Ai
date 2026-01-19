-- RLS FIX SCRIPT
-- RUN THIS IN YOUR SUPABASE DASHBOARD -> SQL EDITOR

-- 1. Enable RLS on main tables (just in case)
alter table public.medication_history enable row level security;
alter table public.api_keys enable row level security;

-- 2. Drop insecure policies if they exist (clean slate)
drop policy if exists "Allow all inserts" on public.medication_history;
drop policy if exists "Allow public read" on public.medication_history;
drop policy if exists "Users can insert their own scans" on public.medication_history;
drop policy if exists "Users can view their own scans" on public.medication_history;

-- 3. Create SECURE policies for medication_history
-- Only allow users to INSERT rows where user_id matches their auth ID
create policy "Users can insert their own scans"
on public.medication_history for insert
with check (auth.uid() = user_id);

-- Only allow users to VIEW rows where user_id matches their auth ID
create policy "Users can view their own scans"
on public.medication_history for select
using (auth.uid() = user_id);

-- 4. Verify API Keys policies (these looked okay but safe to re-apply)
drop policy if exists "Users can view their own keys" on public.api_keys;
drop policy if exists "Users can insert their own keys" on public.api_keys;
drop policy if exists "Users can delete their own keys" on public.api_keys;

create policy "Users can view their own keys"
on public.api_keys for select
using (auth.uid() = user_id);

create policy "Users can insert their own keys"
on public.api_keys for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own keys"
on public.api_keys for delete
using (auth.uid() = user_id);

-- 5. IMPORTANT: Fix existing data (Optional - use if needed)
-- If you have rows with NULL user_id that you want to claim, you can update them manually.
-- Or delete them:
-- DELETE FROM public.medication_history WHERE user_id IS NULL;
