-- Top-up Codes (One-time use vouchers)
create table public.topup_codes (
  code text primary key,
  credits integer not null,
  active boolean not null default true,
  expires_at timestamp with time zone,
  redeemed_by uuid references auth.users,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Service role only for creation/reading unredeemed. Users can't see the list.
alter table public.topup_codes enable row level security;
-- No public policies needed, all interaction via RPC

-- User Private Profile (PRO Only Data)
create table public.user_private_profile (
  user_id uuid references auth.users not null primary key,
  age integer,
  sex text,
  weight text,
  allergies text, -- stored as comma separated or JSON text
  chronic_conditions text,
  current_medications text,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_private_profile enable row level security;
create policy "Users manage own private profile" on public.user_private_profile
  for all using (auth.uid() = user_id);

-- Memories (Medication History Aggregation)
create table public.memories_medications (
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

alter table public.memories_medications enable row level security;
create policy "Users view own memories" on public.memories_medications
  for select using (auth.uid() = user_id);
create policy "Users delete own memories" on public.memories_medications
  for delete using (auth.uid() = user_id);
-- Ingestion handled via server-side logic usually, but we can allow insert if client does it authenticated
create policy "Users insert own memories" on public.memories_medications
  for insert with check (auth.uid() = user_id);
create policy "Users update own memories" on public.memories_medications
  for update using (auth.uid() = user_id);


-- Atomic Redemption RPC
create or replace function public.redeem_topup_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_credits int;
  v_code_row record;
  v_new_balance int;
begin
  -- 1. Try to atomically lock and update the code
  update public.topup_codes
  set redeemed_by = p_user_id,
      redeemed_at = now()
  where code = p_code
    and active = true
    and redeemed_at is null
    and (expires_at is null or expires_at > now())
  returning credits into v_credits;

  -- 2. Check if update happened
  if v_credits is null then
    return jsonb_build_object('success', false, 'error', 'Invalid, expired, or already redeemed code');
  end if;

  -- 3. Insert into Ledger
  insert into public.credit_ledger (user_id, delta, reason, metadata, request_id)
  values (p_user_id, v_credits, 'topup_code', jsonb_build_object('code', p_code), 'req_' || p_code)
  returning delta into v_credits; -- just ensuring insert worked

  -- 4. Calculate new total balance (approximate or just return success)
  -- We can reuse the logic from creditService or just return success + credits added
  
  return jsonb_build_object('success', true, 'credits_added', v_credits);
end;
$$;
