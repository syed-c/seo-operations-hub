-- Migration to update 'pages' table for Edge Functions

-- Add missing columns to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS h1 TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS on_page_data JSONB,
ADD COLUMN IF NOT EXISTS last_audited TIMESTAMP WITH TIME ZONE;

-- Add unique constraint for upsert functionality
-- We safely try to add it only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pages_project_id_url_key'
    ) THEN
        ALTER TABLE pages ADD CONSTRAINT pages_project_id_url_key UNIQUE (project_id, url);
    END IF;
END $$;
