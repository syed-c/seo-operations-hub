-- Fix keywords table schema to ensure all required columns exist

-- Ensure created_at column exists (for ordering)
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the column is properly populated for existing records
UPDATE keywords 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Ensure keyword_rankings has proper foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_keyword' 
    AND table_name = 'keyword_rankings'
  ) THEN
    ALTER TABLE keyword_rankings 
    ADD CONSTRAINT fk_keyword 
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE;
  END IF;
END $$;