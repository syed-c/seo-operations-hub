-- Fix pages table to add missing CWV columns

-- Add Core Web Vitals columns to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS last_audited TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cwv_lcp FLOAT,
ADD COLUMN IF NOT EXISTS cwv_cls FLOAT,
ADD COLUMN IF NOT EXISTS cwv_fid FLOAT,
ADD COLUMN IF NOT EXISTS performance_score FLOAT,
ADD COLUMN IF NOT EXISTS seo_score FLOAT,
ADD COLUMN IF NOT EXISTS accessibility_score FLOAT;