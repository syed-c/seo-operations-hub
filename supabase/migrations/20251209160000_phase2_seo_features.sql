-- Migration for Phase 2 SEO Features
-- This migration adds additional columns and tables needed for the SEO engine

-- Add columns to keywords table for tracking
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS target_position INTEGER CHECK (target_position > 0),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS difficulty_score FLOAT,
ADD COLUMN IF NOT EXISTS last_difficulty_check TIMESTAMP WITH TIME ZONE;

-- Add columns to pages table for content audit
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

-- Add columns to websites table for technical audit
ALTER TABLE websites 
ADD COLUMN IF NOT EXISTS last_technical_audit TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT true;

-- Add columns to backlinks table for toxicity scoring
ALTER TABLE backlinks 
ADD COLUMN IF NOT EXISTS toxicity_score FLOAT,
ADD COLUMN IF NOT EXISTS spam_reason TEXT,
ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS lost BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_keywords_project ON keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_keywords_last_checked ON keywords(last_checked);
CREATE INDEX IF NOT EXISTS idx_pages_website ON pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_last_audited ON pages(last_audited);
CREATE INDEX IF NOT EXISTS idx_websites_project ON websites(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword ON keyword_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_recorded ON keyword_rankings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_backlinks_project ON backlinks(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_audit ON audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_page ON audit_results(page_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_severity ON audit_results(severity);

-- Create table for ranking alerts
CREATE TABLE IF NOT EXISTS ranking_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  previous_position INTEGER,
  current_position INTEGER,
  threshold_position INTEGER,
  alert_type TEXT CHECK (alert_type IN ('drop', 'improvement', 'threshold_breach')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for ranking history (for charts)
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER,
  search_volume INTEGER,
  location TEXT,
  device TEXT CHECK (device IN ('desktop', 'mobile')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for GSC metrics
CREATE TABLE IF NOT EXISTS gsc_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  page_url TEXT,
  clicks INTEGER,
  impressions INTEGER,
  ctr FLOAT,
  avg_position FLOAT,
  date DATE
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_ranking_alerts_keyword ON ranking_alerts(keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranking_alerts_project ON ranking_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_ranking_alerts_sent ON ranking_alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_ranking_history_keyword ON ranking_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_project ON ranking_history(project_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded ON ranking_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_project ON gsc_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_date ON gsc_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_page_url ON gsc_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_backlinks_toxicity ON backlinks(toxicity_score);
CREATE INDEX IF NOT EXISTS idx_backlinks_discovered ON backlinks(discovered_at);
CREATE INDEX IF NOT EXISTS idx_backlinks_lost ON backlinks(lost);

-- Add RLS policies for new tables
ALTER TABLE ranking_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_metrics ENABLE ROW LEVEL SECURITY;

-- Ranking alerts policies
CREATE POLICY "Users can access project ranking alerts" ON ranking_alerts
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Ranking history policies
CREATE POLICY "Users can access project ranking history" ON ranking_history
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- GSC metrics policies
CREATE POLICY "Users can access project gsc metrics" ON gsc_metrics
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admin policies for new tables
CREATE POLICY "Admins can manage all ranking alerts" ON ranking_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can manage all ranking history" ON ranking_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can manage all gsc metrics" ON gsc_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  );