-- Improve RLS policies for project_members table to avoid recursion
-- This migration improves the fix for the infinite recursion issue

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;

-- Create improved policies using a simpler approach
-- Members can view project memberships for projects they belong to
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    -- Allow users to see all memberships for projects they're part of
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND EXISTS (
        SELECT 1 FROM project_members pm2
        WHERE pm2.project_id = p.id
        AND pm2.user_id = auth.uid()
      )
    )
  );

-- Project owners can manage memberships
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    -- Allow project owners to manage memberships
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND EXISTS (
        SELECT 1 FROM project_members pm2
        WHERE pm2.project_id = p.id
        AND pm2.user_id = auth.uid()
        AND pm2.role = 'owner'
      )
    )
  );