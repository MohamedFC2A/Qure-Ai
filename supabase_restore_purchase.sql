-- ================================================================
-- RESTORE FAILED PLAN PURCHASES
-- This script finds users who paid 2000 credits for 'plan_purchase'
-- in the last 24 hours but are still marked as 'free' (due to the error).
-- ================================================================

DO $$
DECLARE
    r RECORD;
    v_updated_count int := 0;
BEGIN
    FOR r IN 
        SELECT cl.user_id, cl.created_at
        FROM public.credit_ledger cl
        JOIN public.profiles p ON cl.user_id = p.id
        WHERE cl.reason = 'plan_purchase' 
          AND cl.delta = -2000 
          AND p.plan = 'free' -- Still free despite paying
          AND cl.created_at > now() - interval '24 hours' -- Recent only
    LOOP
        -- Restore the plan
        UPDATE public.profiles
        SET plan = 'ultra',
            plan_expires_at = r.created_at + interval '30 days' -- Honor 30 days from PAYMENT time
        WHERE id = r.user_id;
        
        v_updated_count := v_updated_count + 1;
        RAISE NOTICE 'Restored Ultra Plan for User ID: % (Paid at: %)', r.user_id, r.created_at;
    END LOOP;

    RAISE NOTICE 'Total plans restored: %', v_updated_count;
END $$;
