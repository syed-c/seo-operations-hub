-- Enhance reports table for Phase 4 - Daily and Weekly Reports
-- Enable RLS on reports and notifications tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for reports
CREATE POLICY "Users can view their project reports" ON reports
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports for their projects" ON reports
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reports" ON reports
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

-- Add RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Enhance reports table with additional fields for daily/weekly reports
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS summary JSONB,
ADD COLUMN IF NOT EXISTS changes JSONB,
ADD COLUMN IF NOT EXISTS improvements JSONB,
ADD COLUMN IF NOT EXISTS drops JSONB,
ADD COLUMN IF NOT EXISTS tasks_completed JSONB,
ADD COLUMN IF NOT EXISTS ranking_trends JSONB,
ADD COLUMN IF NOT EXISTS backlink_updates JSONB,
ADD COLUMN IF NOT EXISTS suggested_priorities JSONB,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);