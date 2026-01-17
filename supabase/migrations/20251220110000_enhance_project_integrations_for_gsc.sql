-- Enhance project_integrations table for Google Search Console integration
-- Add GSC-specific fields to track connection state and property information

-- Add new columns to project_integrations table
ALTER TABLE project_integrations 
ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('google_search_console', 'google_analytics', 'google_business_profile')),
ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_email TEXT,
ADD COLUMN IF NOT EXISTS property_url TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_integrations_provider ON project_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_project_integrations_is_connected ON project_integrations(is_connected);
CREATE INDEX IF NOT EXISTS idx_project_integrations_project_provider ON project_integrations(project_id, provider);

-- Update existing records to set provider field
UPDATE project_integrations 
SET provider = service_name 
WHERE service_name IN ('google_search_console', 'google_analytics', 'google_business_profile') 
AND provider IS NULL;

-- Add constraint to ensure provider and service_name are consistent
-- Add constraint to ensure provider and service_name are consistent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_provider_service_name_consistency'
    ) THEN
        ALTER TABLE project_integrations 
        ADD CONSTRAINT chk_provider_service_name_consistency 
        CHECK (provider IS NULL OR provider = service_name);
    END IF;
END $$;