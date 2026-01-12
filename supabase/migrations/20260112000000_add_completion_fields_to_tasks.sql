-- Add completion details fields to tasks table
-- These fields are used when a task is submitted for review

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_details TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_doc_url TEXT;

-- Update RLS policies to allow authenticated users to update these fields
-- Actually, the existing RLS policies should already cover this if they allow UPDATE on tasks.
