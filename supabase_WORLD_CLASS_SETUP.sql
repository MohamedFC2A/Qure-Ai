-- =====================================================================
-- QURE SCAN - WORLD-CLASS ENTERPRISE SUPABASE SETUP
-- 1. Row Level Security (RLS) & Strict Multi-Tenant Family Isolation
-- 2. pgvector Extension & Vector Similarity Search (RAG)
-- 3. Private Storage Buckets & Strict Storage RLS Policies
-- 4. Realtime Subscriptions Publication
-- 5. Passkeys & MFA Support Structures
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENABLE EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. CORE TABLES & FAMILY CARE PROFILES ISOLATION
-- ---------------------------------------------------------------------

-- Profiles Table (Core Account)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  username TEXT UNIQUE,
  full_name TEXT,
  gender TEXT,
  age INTEGER,
  height TEXT,
  weight TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  plan_expires_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);


-- Care Profiles (Family Members - Strict Isolation per Account)
CREATE TABLE IF NOT EXISTS public.care_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  relationship TEXT DEFAULT 'family',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.care_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict family isolation: owner view care profiles" ON public.care_profiles;
CREATE POLICY "Strict family isolation: owner view care profiles"
  ON public.care_profiles FOR SELECT
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Strict family isolation: owner insert care profiles" ON public.care_profiles;
CREATE POLICY "Strict family isolation: owner insert care profiles"
  ON public.care_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Strict family isolation: owner update care profiles" ON public.care_profiles;
CREATE POLICY "Strict family isolation: owner update care profiles"
  ON public.care_profiles FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Strict family isolation: owner delete care profiles" ON public.care_profiles;
CREATE POLICY "Strict family isolation: owner delete care profiles"
  ON public.care_profiles FOR DELETE
  USING (auth.uid() = owner_user_id AND id <> auth.uid());


-- Care Private Profiles (Private Context per Family Member)
CREATE TABLE IF NOT EXISTS public.care_private_profiles (
  profile_id UUID REFERENCES public.care_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  age INTEGER,
  sex TEXT,
  height TEXT,
  weight TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.care_private_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict family isolation: owner manage private profiles" ON public.care_private_profiles;
CREATE POLICY "Strict family isolation: owner manage private profiles"
  ON public.care_private_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = care_private_profiles.profile_id
        AND cp.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = care_private_profiles.profile_id
        AND cp.owner_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 3. MEDICATION & MEDICAL SCANS HISTORY (ISOLATED PER FAMILY PROFILE)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.medication_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.care_profiles(id) ON DELETE CASCADE NOT NULL,
  drug_name TEXT NOT NULL,
  manufacturer TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'OCR_PROCESSING', 'AI_ANALYZING', 'COMPLETED', 'FAILED')),
  analysis_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.medication_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict RLS: view own medication history" ON public.medication_history;
CREATE POLICY "Strict RLS: view own medication history"
  ON public.medication_history FOR SELECT
  USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = medication_history.profile_id AND cp.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Strict RLS: insert own medication history" ON public.medication_history;
CREATE POLICY "Strict RLS: insert own medication history"
  ON public.medication_history FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = medication_history.profile_id AND cp.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Strict RLS: update own medication history" ON public.medication_history;
CREATE POLICY "Strict RLS: update own medication history"
  ON public.medication_history FOR UPDATE
  USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = medication_history.profile_id AND cp.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Strict RLS: delete own medication history" ON public.medication_history;
CREATE POLICY "Strict RLS: delete own medication history"
  ON public.medication_history FOR DELETE
  USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = medication_history.profile_id AND cp.owner_user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- 4. PGVECTOR EMBEDDINGS TABLE & RAG SEARCH FUNCTION
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.scan_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.care_profiles(id) ON DELETE CASCADE NOT NULL,
  medication_history_id UUID REFERENCES public.medication_history(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536), -- Supports OpenAI / Gemini vector embeddings
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scan_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict RLS: view own scan embeddings" ON public.scan_embeddings;
CREATE POLICY "Strict RLS: view own scan embeddings"
  ON public.scan_embeddings FOR SELECT
  USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = scan_embeddings.profile_id AND cp.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Strict RLS: insert own scan embeddings" ON public.scan_embeddings;
CREATE POLICY "Strict RLS: insert own scan embeddings"
  ON public.scan_embeddings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.care_profiles cp
      WHERE cp.id = scan_embeddings.profile_id AND cp.owner_user_id = auth.uid()
    )
  );

-- HNSW Vector Index for High-Performance Similarity Search
CREATE INDEX IF NOT EXISTS idx_scan_embeddings_hnsw 
  ON public.scan_embeddings 
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_scan_embeddings_user_profile 
  ON public.scan_embeddings (user_id, profile_id);


-- Vector Match RPC Function for RAG (Retrieval-Augmented Generation)
CREATE OR REPLACE FUNCTION public.match_scan_vectors(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  medication_history_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.medication_history_id,
    se.content,
    se.metadata,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM public.scan_embeddings se
  WHERE se.user_id = auth.uid()
    AND (p_profile_id IS NULL OR se.profile_id = p_profile_id)
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ---------------------------------------------------------------------
-- 5. PRIVATE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ---------------------------------------------------------------------

-- Create Private Buckets for Medical Scans
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical_scans',
  'medical_scans',
  FALSE, -- PRIVATE BUCKET (Encrypted Signed URLs Required)
  20971520, -- 20MB Max File Size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policy: Users can only upload into their own folder: user_id/*
DROP POLICY IF EXISTS "Strict Storage RLS: Users upload own scans" ON storage.objects;
CREATE POLICY "Strict Storage RLS: Users upload own scans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical_scans' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can only view own scan files via signed URL
DROP POLICY IF EXISTS "Strict Storage RLS: Users select own scans" ON storage.objects;
CREATE POLICY "Strict Storage RLS: Users select own scans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical_scans'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can delete own scans
DROP POLICY IF EXISTS "Strict Storage RLS: Users delete own scans" ON storage.objects;
CREATE POLICY "Strict Storage RLS: Users delete own scans"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical_scans'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- 6. REALTIME SUBSCRIPTIONS PUBLICATION
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'medication_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_history;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 7. WEBAUTHN PASSKEYS & BIOMETRICS METADATA TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0 NOT NULL,
  device_type TEXT DEFAULT 'unknown', -- 'iphone_faceid', 'android_biometric', 'mac_touchid', 'windows_hello'
  friendly_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own passkeys" ON public.user_passkeys;
CREATE POLICY "Users view own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own passkeys" ON public.user_passkeys;
CREATE POLICY "Users manage own passkeys"
  ON public.user_passkeys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

SELECT 'World-Class Supabase Setup Completed Successfully!' as status;
