-- Migration: Fix Database Error saving new user in handle_new_user trigger
-- Project: Qure AI New (kzrcnmxcmrvrahukabjh)

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_raw_username text;
  v_username text;
  v_base_username text;
  v_counter integer := 1;
  v_full_name text;
  v_gender text;
  v_age integer;
  v_height text;
  v_weight text;
BEGIN
  -- Extract and sanitize username (strictly English alphanumeric + underscore, no spaces, no Arabic)
  v_raw_username := lower(trim(coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  )));
  
  -- Strip spaces and non-alphanumeric chars (keep a-z0-9_)
  v_base_username := regexp_replace(v_raw_username, '[^a-z0-9_]', '', 'g');
  IF length(v_base_username) < 3 THEN
    v_base_username := 'user_' || substr(md5(new.id::text), 1, 5);
  END IF;

  v_username := v_base_username;

  -- Ensure uniqueness in profiles
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username) AND id != new.id) LOOP
    v_username := v_base_username || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null);
  v_gender := coalesce(new.raw_user_meta_data->>'gender', null);
  
  BEGIN
    v_age := (new.raw_user_meta_data->>'age')::integer;
  EXCEPTION WHEN OTHERS THEN
    v_age := null;
  END;

  v_height := new.raw_user_meta_data->>'height';
  v_weight := new.raw_user_meta_data->>'weight';

  -- 1. Insert or update profile
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      plan,
      username,
      full_name,
      gender,
      age,
      height,
      weight,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      new.email,
      'free',
      v_username,
      v_full_name,
      v_gender,
      v_age,
      v_height,
      v_weight,
      coalesce(new.created_at, now()),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      username = coalesce(profiles.username, EXCLUDED.username),
      gender = coalesce(EXCLUDED.gender, profiles.gender),
      age = coalesce(EXCLUDED.age, profiles.age),
      height = coalesce(EXCLUDED.height, profiles.height),
      weight = coalesce(EXCLUDED.weight, profiles.weight),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
  END;

  -- 2. Auto-create self care profile if not exists (Matching actual schema)
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.care_profiles WHERE owner_user_id = new.id AND relationship = 'self') THEN
      INSERT INTO public.care_profiles (
        owner_user_id,
        display_name,
        relationship,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        coalesce(v_full_name, v_username, 'My Profile'),
        'self',
        now(),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating care profile for user %: %', new.id, SQLERRM;
  END;

  -- 3. Ensure usage_windows record exists
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.usage_windows WHERE user_id = new.id) THEN
      INSERT INTO public.usage_windows (
        user_id,
        daily_used,
        monthly_used,
        daily_window_start,
        monthly_window_start
      )
      VALUES (
        new.id,
        0,
        0,
        now(),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating usage window for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$function$;
