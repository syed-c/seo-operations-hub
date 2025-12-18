-- Fix backlinks table schema to match the free-stack transformation
-- This script removes old Ahrefs/Moz fields and adds new toxicity scoring fields

-- First, remove old columns that should not exist anymore
ALTER TABLE backlinks
DROP COLUMN IF EXISTS domain_authority,
DROP COLUMN IF EXISTS spam_score,
DROP COLUMN IF EXISTS link_type;

-- Add updated free-stack columns
ALTER TABLE backlinks
ADD COLUMN IF NOT EXISTS toxicity_score float,
ADD COLUMN IF NOT EXISTS spam_reason text,
ADD COLUMN IF NOT EXISTS discovered_at timestamptz,
ADD COLUMN IF NOT EXISTS lost boolean DEFAULT false;

-- Make sure created_at exists with proper default
ALTER TABLE backlinks
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update any existing records to have discovered_at if not set
UPDATE backlinks 
SET discovered_at = created_at 
WHERE discovered_at IS NULL;

-- Verify the schema
-- Run this query to check:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'backlinks' 
-- ORDER BY ordinal_position;