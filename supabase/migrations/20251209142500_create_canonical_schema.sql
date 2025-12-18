-- Create canonical database schema based on PRD
-- This migration creates all required tables with proper relationships and constraints

-- Core authentication and user management tables
-- Note: auth.users table is managed by Supabase Auth and should already exist
-- If it doesn't exist, you'll need to enable Supabase Auth first

CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  name TEXT, -- Full name, automatically populated from first_name and last_name
  email TEXT UNIQUE NOT NULL,
  role TEXT REFERENCES roles(name),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL, -- read, write, delete, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, resource, action)
);

-- Project management tables
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'critical')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- google_search_console, google_analytics, etc.
  credentials JSONB, -- encrypted credentials
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website and page management tables
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT, -- dns, html_file, meta_tag, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  page_type TEXT, -- blog, product, landing, etc.
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword management tables
CREATE TABLE IF NOT EXISTS keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  intent TEXT, -- informational, navigational, transactional, commercial
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  volume INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyword_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  location TEXT,
  device TEXT CHECK (device IN ('desktop', 'mobile')),
  position INTEGER,
  search_volume INTEGER,
  trend TEXT, -- up, down, stable
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO Audit tables
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL, -- content, technical, backlink, local
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  issue_type TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  recommendation TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task management tables
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('content', 'technical', 'backlinks', 'local', 'audit', 'general')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Automation tables
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT, -- ranking_drop, new_keyword, etc.
  condition JSONB, -- { "metric": "position", "operator": "<", "value": 10 }
  action JSONB, -- { "type": "create_task", "template": {...} }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights tables
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- opportunity, risk, recommendation
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- create_task, update_content, fix_technical
  details JSONB,
  estimated_impact INTEGER CHECK (estimated_impact >= 0 AND estimated_impact <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlink tracking tables
CREATE TABLE IF NOT EXISTS backlinks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  spam_score INTEGER CHECK (spam_score >= 0 AND spam_score <= 100),
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backlink_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backlink_id UUID REFERENCES backlinks(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reporting tables
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- daily, weekly, monthly, audit
  title TEXT NOT NULL,
  content JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication tables
CREATE TABLE IF NOT EXISTS team_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logging
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
  ('Super Admin', 'Full system access'),
  ('Admin', 'Administrative access to all projects'),
  ('SEO Lead', 'Lead SEO specialist with project management rights'),
  ('Content Lead', 'Content team lead'),
  ('Backlink Lead', 'Backlink team lead'),
  ('Technical SEO', 'Technical SEO specialist'),
  ('Developer', 'Developer access'),
  ('Client', 'Client access with read-only permissions'),
  ('Viewer', 'Limited viewer access')
ON CONFLICT (name) DO NOTHING;