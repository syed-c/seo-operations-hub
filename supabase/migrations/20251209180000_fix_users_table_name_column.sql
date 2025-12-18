-- Add name column to users table for consistency
-- This migration adds a name column to the users table that combines first_name and last_name

-- Add the name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Populate the name column with concatenated first_name and last_name
UPDATE users 
SET name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE name IS NULL OR name = '';

-- Create a trigger function to automatically update the name column
CREATE OR REPLACE FUNCTION update_user_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the name column when first_name or last_name changes
DROP TRIGGER IF EXISTS update_user_name_trigger ON users;
CREATE TRIGGER update_user_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_name();

-- Add a comment to explain the purpose of the name column
COMMENT ON COLUMN users.name IS 'Full name of the user, automatically populated from first_name and last_name';