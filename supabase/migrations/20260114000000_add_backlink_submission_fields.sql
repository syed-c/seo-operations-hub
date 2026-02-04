-- Add backlink submission fields to tasks table
-- These fields are used when a backlink lead submits a task for review

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS backlink_summary TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS backlink_links_created JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS backlink_links_indexed JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS backlink_submission_type TEXT;

-- Add a check constraint to ensure submission_type is valid
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backlink_submission_type_check') THEN
        ALTER TABLE tasks ADD CONSTRAINT backlink_submission_type_check 
        CHECK (backlink_submission_type IS NULL OR backlink_submission_type IN ('create', 'index', 'both'));
    END IF;
END $$;


-- Update RLS policies to allow authenticated users to update these fields
-- The existing RLS policies should already cover this if they allow UPDATE on tasks.
