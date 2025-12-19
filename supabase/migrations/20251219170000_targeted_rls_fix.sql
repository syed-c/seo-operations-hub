-- Targeted RLS fix for project_members table
-- This migration specifically targets the recursion issue in project_members policies

-- Completely drop and recreate project_members policies with a simpler approach
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;

-- Create very simple policies that avoid any subqueries
-- Members can view project memberships (simplified)
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    -- Direct check without subquery to avoid recursion
    user_id = auth.uid()
  );

-- Project owners can manage memberships (simplified)
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    -- Direct check for ownership without subquery recursion
    (user_id = auth.uid() AND role = 'owner')
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('Super Admin', 'Admin')
    )
  );