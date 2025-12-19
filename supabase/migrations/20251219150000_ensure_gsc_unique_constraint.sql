-- Ensure GSC metrics table has the UNIQUE constraint
-- This migration ensures the UNIQUE constraint exists on the gsc_metrics table

-- First, try to drop the constraint if it exists (to avoid conflicts)
ALTER TABLE gsc_metrics DROP CONSTRAINT IF EXISTS gsc_metrics_project_id_date_page_url_key;

-- Add the UNIQUE constraint
ALTER TABLE gsc_metrics 
ADD CONSTRAINT gsc_metrics_project_id_date_page_url_key 
UNIQUE (project_id, date, page_url);