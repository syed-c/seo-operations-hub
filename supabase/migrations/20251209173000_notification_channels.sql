-- Create notification channels table for multi-channel notifications
CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'slack', 'whatsapp', 'in_app')),
  channel_identifier TEXT NOT NULL, -- email address, slack webhook, phone number, etc.
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_type)
);

-- Create notification_templates table for predefined notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'slack', 'whatsapp', 'in_app')),
  event_type TEXT NOT NULL, -- ranking_drop, task_blocked, issue_detected, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, subject, content, channel_type, event_type) VALUES
  ('ranking_drop_alert', 'Ranking Drop Alert: {{keyword}}', 'The keyword "{{keyword}}" has dropped from position {{previous_position}} to {{current_position}}.', 'email', 'ranking_drop'),
  ('task_blocked_alert', 'Blocked Task Requires Attention', 'Task "{{task_title}}" has been blocked for {{days_blocked}} days and requires immediate attention.', 'email', 'task_blocked'),
  ('issue_detected_alert', 'New SEO Issue Detected', 'A new {{issue_type}} issue was detected on {{page_url}}. Severity: {{severity}}.', 'email', 'issue_detected'),
  ('weekly_report_ready', 'Your Weekly SEO Report is Ready', 'Your weekly SEO report for {{project_name}} is now available. Log in to view the detailed analysis.', 'email', 'weekly_report_ready')
ON CONFLICT (name) DO NOTHING;

-- Create notification_events table to track when notifications are sent
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'slack', 'whatsapp', 'in_app')),
  channel_identifier TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_channels_user_id ON notification_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON notification_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_event_type ON notification_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_events_notification_id ON notification_events(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_status ON notification_events(status);

-- Enable RLS on new tables
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for notification_channels
CREATE POLICY "Users can view their notification channels" ON notification_channels
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their notification channels" ON notification_channels
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add RLS policies for notification_templates (read-only for all users)
CREATE POLICY "Users can view notification templates" ON notification_templates
  FOR SELECT USING (true);

-- Add RLS policies for notification_events
CREATE POLICY "Users can view events for their notifications" ON notification_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_events.notification_id
      AND n.user_id = auth.uid()
    )
  );

-- Grant necessary permissions for service role (for backend processes)
-- These would typically be used by Edge Functions to send notifications