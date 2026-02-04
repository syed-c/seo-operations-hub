-- Add account_email column to project_integrations table
-- This is where account identity information should be stored, not in user_tokens

ALTER TABLE project_integrations 
ADD COLUMN IF NOT EXISTS account_email TEXT;

-- Create index for account email lookups (idempotent check)
DROP INDEX IF EXISTS idx_project_integrations_account_email;
CREATE INDEX idx_project_integrations_account_email 
ON project_integrations(account_email) 
WHERE account_email IS NOT NULL;