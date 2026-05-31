-- ================================================================
-- ACTIVATE ULTRA PLAN FOR UVERSION STORE
-- Run this script in the Supabase Dashboard SQL Editor.
-- ================================================================

-- Update the profiles table to set the plan to 'ultra' for user uversionstore@gmail.com (UID: 43304a66-686e-437d-b171-3734d37cda59)
UPDATE public.profiles
SET plan = 'ultra'
WHERE id = '43304a66-686e-437d-b171-3734d37cda59';

-- Verify the update
SELECT id, email, plan FROM public.profiles WHERE id = '43304a66-686e-437d-b171-3734d37cda59';
