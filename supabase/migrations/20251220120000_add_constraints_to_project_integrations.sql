-- Add constraints and indexes to project_integrations table for better data integrity

-- Add unique constraint for project_id and provider combination
ALTER TABLE project_integrations 
ADD CONSTRAINT uk_project_integrations_project_provider 
UNIQUE (project_id, provider);

-- Add check constraint for provider values
ALTER TABLE project_integrations 
ADD CONSTRAINT chk_project_integrations_provider 
CHECK (provider IN ('google_search_console', 'google_analytics', 'google_business_profile'));

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_project_integrations_project_provider_connected 
ON project_integrations(project_id, provider, is_connected);

-- Create index for account email lookups
CREATE INDEX IF NOT EXISTS idx_project_integrations_account_email 
ON project_integrations(account_email) 
WHERE account_email IS NOT NULL;

-- Create index for property URL lookups
CREATE INDEX IF NOT EXISTS idx_project_integrations_property_url 
ON project_integrations(property_url) 
WHERE property_url IS NOT NULL;

-- Add foreign key constraint for project_id if not exists
ALTER TABLE project_integrations 
ADD CONSTRAINT fk_project_integrations_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;