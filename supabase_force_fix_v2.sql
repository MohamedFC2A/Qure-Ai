-- ================================================================
-- FORCE FIX V3: SCHEMA REPAIR & RESTORE ULTRA PLAN
-- ================================================================

-- 1. SCHEMA REPAIR: Add 'updated_at' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone default timezone('utc'::text, now());
        RAISE NOTICE 'Added missing column: updated_at';
    END IF;
    
    -- Also double check plan_expires_at just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE public.profiles ADD COLUMN plan_expires_at timestamp with time zone;
        RAISE NOTICE 'Added missing column: plan_expires_at';
    END IF;
END $$;


-- 2. DATA RESTORE: Restore Plan for Paid Users
DO $$
DECLARE
    r RECORD;
    v_updated_rows int;
    v_found_count int := 0;
BEGIN
    -- Iterate over all users who paid 2000 credits in the last 24h
    FOR r IN 
        SELECT DISTINCT user_id, created_at
        FROM public.credit_ledger
        WHERE reason = 'plan_purchase' 
          AND delta = -2000
          AND created_at > (now() - interval '24 hours')
    LOOP
        v_found_count := v_found_count + 1;
        RAISE NOTICE 'Found payment for User ID: % at %', r.user_id, r.created_at;

        -- Force Update Profile (Upsert)
        INSERT INTO public.profiles (id, plan, plan_expires_at, updated_at)
        VALUES (
            r.user_id, 
            'ultra', 
            r.created_at + interval '30 days',
            now()
        )
        ON CONFLICT (id) DO UPDATE
        SET plan = 'ultra',
            plan_expires_at = EXCLUDED.plan_expires_at,
            updated_at = now();

        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        RAISE NOTICE '  -> Profile updated successfully';
        
    END LOOP;

    IF v_found_count = 0 THEN
       RAISE NOTICE 'No recent plan purchases found in ledger.';
    ELSE
       RAISE NOTICE 'Restoration Complete. Found and fixed % users.', v_found_count;
    END IF;
END $$;
