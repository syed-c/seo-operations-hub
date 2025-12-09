-- Enable RLS on all required tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

-- Create project_members junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view projects they belong to
CREATE POLICY "Users can view projects they belong to" ON projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert projects they're authorized to create
CREATE POLICY "Authorized users can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  );

-- Project owners can update their projects
CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Users can view project memberships for projects they belong to
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Project owners can manage memberships
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Generic pattern for project-related tables
CREATE POLICY "Users can access project websites" ON websites
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access project pages" ON pages
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access project tasks" ON tasks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access project keywords" ON keywords
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access project keyword rankings" ON keyword_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM keywords k
      JOIN project_members pm ON k.project_id = pm.project_id
      WHERE k.id = keyword_rankings.keyword_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access project backlinks" ON backlinks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admin operations bypass RLS (handled by Edge Functions with service role key)
-- These policies allow admins to perform operations through Edge Functions
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