-- Targeted fix for RLS infinite recursion issues with existing tables only

-- First, drop all existing policies that might reference the functions
DROP POLICY IF EXISTS "Users can view projects they belong to" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;
DROP POLICY IF EXISTS "Users can access project websites" ON websites;
DROP POLICY IF EXISTS "Users can access project pages" ON pages;
DROP POLICY IF EXISTS "Users can access project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can access project keywords" ON keywords;
DROP POLICY IF EXISTS "Users can access project keyword rankings" ON keyword_rankings;
DROP POLICY IF EXISTS "Users can access project backlinks" ON backlinks;

-- Now drop the functions with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS user_in_project(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_in_project(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_is_project_owner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_is_project_owner(UUID) CASCADE;

-- Recreate the security definer functions with unique names
CREATE OR REPLACE FUNCTION check_user_in_project(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_members pm 
    WHERE pm.project_id = p_project_id 
    AND pm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check if a user is an owner of a project
CREATE OR REPLACE FUNCTION check_user_is_project_owner(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_members pm 
    WHERE pm.project_id = p_project_id 
    AND pm.user_id = p_user_id
    AND pm.role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all policies using the new functions

-- Projects table policies
CREATE POLICY "Users can view projects they belong to" ON projects
  FOR SELECT USING (
    check_user_in_project(id, auth.uid())
  );

CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (
    check_user_is_project_owner(id, auth.uid())
  );

-- Project members table policies
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    check_user_in_project(project_id, auth.uid())
  );

CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    check_user_is_project_owner(project_id, auth.uid())
  );

-- Other project-related table policies
CREATE POLICY "Users can access project websites" ON websites
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

CREATE POLICY "Users can access project pages" ON pages
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

CREATE POLICY "Users can access project tasks" ON tasks
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

CREATE POLICY "Users can access project keywords" ON keywords
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );

CREATE POLICY "Users can access project keyword rankings" ON keyword_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM keywords k
      WHERE k.id = keyword_rankings.keyword_id
      AND check_user_in_project(k.project_id, auth.uid())
    )
  );

CREATE POLICY "Users can access project backlinks" ON backlinks
  FOR ALL USING (
    check_user_in_project(project_id, auth.uid())
  );