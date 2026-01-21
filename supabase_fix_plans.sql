-- ================================================================
-- FIX: ADD MISSING COLUMN 'plan_expires_at' TO PROFILES
-- ================================================================

-- 1. Add column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'plan_expires_at') then
        alter table public.profiles add column plan_expires_at timestamp with time zone;
    end if;
end $$;


-- 2. REFRESH THE PURCHASE FUNCTION
-- Just to be safe and ensure the function refers to the correct schema signature.

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
  -- 1. Calculate Current Balance (Sum from ledger)
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
