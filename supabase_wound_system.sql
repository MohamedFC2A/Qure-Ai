-- ================================================================
-- QURE WOUND ASSESSMENT & LONGITUDINAL HEALING SCHEMA
-- ================================================================

-- 1. Create wound_scans Table
create table if not exists public.wound_scans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    profile_id uuid references public.care_profiles(id) on delete set null,
    wound_title text not null default 'فحص جرح وإصابة جلدية',
    wound_type text not null default 'unspecified', -- laceration, abrasion, burn, puncture, surgical, ulcer, etc.
    severity text not null default 'minor', -- minor, moderate, severe, emergency
    infection_risk text not null default 'low', -- low, medium, high
    requires_sutures boolean not null default false,
    requires_tetanus boolean not null default false,
    healing_stage text default 'inflammatory', -- inflammatory, proliferative, remodeling
    tissue_composition jsonb not null default '{"granulation": 0, "slough": 0, "necrotic": 0, "epithelial": 0}'::jsonb,
    analysis_json jsonb not null default '{}'::jsonb,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on wound_scans
alter table public.wound_scans enable row level security;

-- 3. Policies for wound_scans
do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'wound_scans' and policyname = 'Users can view own wound scans') then
        create policy "Users can view own wound scans" on public.wound_scans for select using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'wound_scans' and policyname = 'Users can insert own wound scans') then
        create policy "Users can insert own wound scans" on public.wound_scans for insert with check (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'wound_scans' and policyname = 'Users can update own wound scans') then
        create policy "Users can update own wound scans" on public.wound_scans for update using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'wound_scans' and policyname = 'Users can delete own wound scans') then
        create policy "Users can delete own wound scans" on public.wound_scans for delete using (auth.uid() = user_id);
    end if;
end $$;

-- 4. Create wound_healing_timeline Table (for tracking healing progression across days)
create table if not exists public.wound_healing_timeline (
    id uuid default gen_random_uuid() primary key,
    wound_id uuid references public.wound_scans(id) on delete cascade not null,
    user_id uuid references auth.users not null,
    day_number integer not null default 1,
    healing_score integer not null default 0, -- 0 to 100% healed
    status_note text,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable RLS on wound_healing_timeline
alter table public.wound_healing_timeline enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'wound_healing_timeline' and policyname = 'Users can view own wound timeline') then
        create policy "Users can view own wound timeline" on public.wound_healing_timeline for select using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'wound_healing_timeline' and policyname = 'Users can insert own wound timeline') then
        create policy "Users can insert own wound timeline" on public.wound_healing_timeline for insert with check (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'wound_healing_timeline' and policyname = 'Users can delete own wound timeline') then
        create policy "Users can delete own wound timeline" on public.wound_healing_timeline for delete using (auth.uid() = user_id);
    end if;
end $$;

-- Indexes for lightning fast queries
create index if not exists idx_wound_scans_user_created on public.wound_scans(user_id, created_at desc);
create index if not exists idx_wound_timeline_wound_id on public.wound_healing_timeline(wound_id, day_number asc);
