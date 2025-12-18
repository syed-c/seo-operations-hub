-- Create gsc_metrics table for storing Google Search Console data
CREATE TABLE IF NOT EXISTS gsc_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  page_url TEXT,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  avg_position NUMERIC DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_project_id ON gsc_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_date ON gsc_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_page_url ON gsc_metrics(page_url);

-- Enable RLS
ALTER TABLE gsc_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies using our security definer functions
CREATE POLICY "Users can access project gsc metrics" ON gsc_metrics
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

-- Admins can manage all gsc metrics
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