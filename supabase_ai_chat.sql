-- ============================================================
-- QURE AI – Nexus AI Chat System
-- Run this migration in Supabase SQL Editor
-- ============================================================

-- 1. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    mode       TEXT NOT NULL CHECK (mode IN ('health', 'medication', 'context')),
    title      TEXT DEFAULT 'New Conversation',
    metadata   JSONB DEFAULT '{}'::jsonb,       -- { medicationName?, analysisSnapshot? }
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS: users can only manage their own conversations
CREATE POLICY "Users can select own conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON public.ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);


-- 2. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations ON DELETE CASCADE NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,   -- { mode, keyPoints?, followUps? }
    created_at      TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage messages in their own conversations
CREATE POLICY "Users can select own messages"
    ON public.ai_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
              AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
              AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own messages"
    ON public.ai_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
              AND ai_conversations.user_id = auth.uid()
        )
    );


-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated
    ON public.ai_conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created
    ON public.ai_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_mode
    ON public.ai_conversations (user_id, mode, updated_at DESC);


-- 4. Function: auto-update updated_at on conversation when messages are added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.ai_conversations
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_ai_message ON public.ai_messages;
CREATE TRIGGER on_new_ai_message
    AFTER INSERT ON public.ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_timestamp();
