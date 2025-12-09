-- Combined migration to set up database schema and RLS policies in correct order

-- Core authentication and user management tables
-- Note: auth.users table is managed by Supabase Auth and should already exist
-- If it doesn't exist, you'll need to enable Supabase Auth first

CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'description') THEN
    ALTER TABLE roles ADD COLUMN description TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
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
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
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
  toxicity_score FLOAT,
  spam_reason TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lost BOOLEAN DEFAULT false,
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

-- Create project_members junction table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on all required tables
-- First disable RLS if it's already enabled to avoid conflicts
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks DISABLE ROW LEVEL SECURITY;

-- Then enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view projects they belong to
DROP POLICY IF EXISTS "Users can view projects they belong to" ON projects;
CREATE POLICY "Users can view projects they belong to" ON projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert projects they're authorized to create
DROP POLICY IF EXISTS "Authorized users can create projects" ON projects;
CREATE POLICY "Authorized users can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  );

-- Project owners can update their projects
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Users can view project memberships for projects they belong to
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Project owners can manage memberships
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Generic pattern for project-related tables
DROP POLICY IF EXISTS "Users can access project websites" ON websites;
CREATE POLICY "Users can access project websites" ON websites
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project pages" ON pages;
CREATE POLICY "Users can access project pages" ON pages
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project tasks" ON tasks;
CREATE POLICY "Users can access project tasks" ON tasks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project keywords" ON keywords;
CREATE POLICY "Users can access project keywords" ON keywords
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project keyword rankings" ON keyword_rankings;
CREATE POLICY "Users can access project keyword rankings" ON keyword_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN project_members pm ON k.project_id = pm.project_id
      WHERE k.id = keyword_rankings.keyword_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project backlinks" ON backlinks;
CREATE POLICY "Users can access project backlinks" ON backlinks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admin operations bypass RLS (handled by Edge Functions with service role key)
-- These policies allow admins to perform operations through Edge Functions
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
CREATE POLICY "Admins can manage all projects" ON projects
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

DROP POLICY IF EXISTS "Admins can manage all websites" ON websites;
CREATE POLICY "Admins can manage all websites" ON websites
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

DROP POLICY IF EXISTS "Admins can manage all pages" ON pages;
CREATE POLICY "Admins can manage all pages" ON pages
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

DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
CREATE POLICY "Admins can manage all tasks" ON tasks
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

DROP POLICY IF EXISTS "Admins can manage all keywords" ON keywords;
CREATE POLICY "Admins can manage all keywords" ON keywords
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

DROP POLICY IF EXISTS "Admins can manage all keyword rankings" ON keyword_rankings;
CREATE POLICY "Admins can manage all keyword rankings" ON keyword_rankings
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

DROP POLICY IF EXISTS "Admins can manage all backlinks" ON backlinks;
CREATE POLICY "Admins can manage all backlinks" ON backlinks
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