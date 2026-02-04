-- Migration to add ai_status and missing score columns

-- Add status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_processing_status') THEN
        CREATE TYPE public.ai_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END $$;

-- Update pages table
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS technical_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_status public.ai_processing_status NOT NULL DEFAULT 'pending';

-- Add index for pending AI tasks
CREATE INDEX IF NOT EXISTS idx_pages_ai_status ON public.pages(ai_status) WHERE ai_status = 'pending';
