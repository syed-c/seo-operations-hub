-- Add filtered links column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS backlink_links_filtered JSONB DEFAULT '[]'::jsonb;

-- Update the check constraint for backlink_submission_type to include 'filtered'
-- First, drop the existing constraint if it exists
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_backlink_submission_type_check;

-- Add the constraint back with 'filtered' option
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_backlink_submission_type_check 
CHECK (
  (
    backlink_submission_type = ANY (
      ARRAY[
        'create'::text,
        'index'::text,
        'both'::text,
        'filtered'::text
      ]
    )
  )
);