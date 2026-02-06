-- Add backlinks column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS backlinks INTEGER DEFAULT 0;

-- Update the column to have a check constraint similar to health_score
ALTER TABLE public.projects 
ADD CONSTRAINT projects_backlinks_check CHECK ((backlinks >= 0));