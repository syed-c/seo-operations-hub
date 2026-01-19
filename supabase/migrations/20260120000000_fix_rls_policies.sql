-- Fix RLS policies to include SEO Lead in Admin-level permissions for Reports and Projects

-- 1. Updates for Reports Table
DROP POLICY IF EXISTS "Admins can manage all reports" ON reports;

CREATE POLICY "Admins and Leads can manage all reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  );

-- 2. Updates for Projects Table (Allow SEO Lead to manage all projects)
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

CREATE POLICY "Admins and Leads can manage all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin', 'SEO Lead')
    )
  );

-- 3. Ensure RLS is enabled on reports (safe to run even if already enabled)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
