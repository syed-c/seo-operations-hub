-- Create gsc_property_metrics table for storing Google Search Console property-level data
CREATE TABLE IF NOT EXISTS gsc_property_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  avg_position NUMERIC DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint for project_id and date combination
  UNIQUE(project_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gsc_property_metrics_project_id ON gsc_property_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_property_metrics_date ON gsc_property_metrics(date);

-- Enable RLS
ALTER TABLE gsc_property_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies using our security definer functions
DROP POLICY IF EXISTS "Users can access project gsc property metrics" ON gsc_property_metrics;
CREATE POLICY "Users can access project gsc property metrics" ON gsc_property_metrics
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

-- Admins can manage all gsc property metrics
DROP POLICY IF EXISTS "Admins can manage all gsc property metrics" ON gsc_property_metrics;
CREATE POLICY "Admins can manage all gsc property metrics" ON gsc_property_metrics
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