-- ========================================================
-- UTILITY SCRIPT: Generate Top-up Codes (Vouchers)
-- Run this in your Supabase SQL Editor to create codes.
-- ========================================================

-- 1. (Optional) Create a helper function to generate random numeric codes
create or replace function generate_random_code(length int) returns text as $$
declare
  chars text[] := '{0,1,2,3,4,5,6,7,8,9}';
  result text := '';
  i integer := 0;
begin
  for i in 1..length loop
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  end loop;
  return result;
end;
$$ language plpgsql;

-- 2. Insert 10 "Starter" Codes (100 Credits each)
-- You can run this multiple times to generate more.
do $$
declare
  new_code text;
  i integer;
begin
  for i in 1..10 loop
    -- Generate a 12-digit code
    new_code := generate_random_code(12);
    
    -- Insert into topup_codes
    -- We use ON CONFLICT do nothing just in case a duplicate is generated (rare)
    insert into public.topup_codes (code, credits, active)
    values (new_code, 100, true)
    on conflict (code) do nothing;
  end loop;
end $$;

-- 3. Select and view the generated codes so you can copy them
select * from public.topup_codes 
where redeemed_by is null 
order by created_at desc 
limit 20;
