-- Fix RLS recursion issue by creating security definer functions

-- Create function to check if user is in a project (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.user_in_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Create function to check if user is owner of a project (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.user_is_project_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$;

-- Update projects table RLS policies to use the security definer function
DROP POLICY IF EXISTS "Users can view projects they belong to" ON projects;
CREATE POLICY "Users can view projects they belong to" ON projects
  FOR SELECT USING (
    public.user_in_project(id)
  );

-- Update project_members table RLS policies to avoid recursion
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    public.user_in_project(project_id)
  );

DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    public.user_is_project_owner(project_id)
  );

-- Also update other table policies that reference project_members to use the function
DROP POLICY IF EXISTS "Users can access project websites" ON websites;
CREATE POLICY "Users can access project websites" ON websites
  FOR ALL USING (
    public.user_in_project(websites.project_id)
  );

DROP POLICY IF EXISTS "Users can access project pages" ON pages;
CREATE POLICY "Users can access project pages" ON pages
  FOR ALL USING (
    public.user_in_project(pages.project_id)
  );

DROP POLICY IF EXISTS "Users can access project tasks" ON tasks;
CREATE POLICY "Users can access project tasks" ON tasks
  FOR ALL USING (
    public.user_in_project(tasks.project_id)
  );

DROP POLICY IF EXISTS "Users can access project keywords" ON keywords;
CREATE POLICY "Users can access project keywords" ON keywords
  FOR ALL USING (
    public.user_in_project(keywords.project_id)
  );

DROP POLICY IF EXISTS "Users can access project keyword rankings" ON keyword_rankings;
CREATE POLICY "Users can access project keyword rankings" ON keyword_rankings
  FOR ALL USING (
    public.user_in_project(keyword_rankings.project_id)
  );

DROP POLICY IF EXISTS "Users can access project backlinks" ON backlinks;
CREATE POLICY "Users can access project backlinks" ON backlinks
  FOR ALL USING (
    public.user_in_project(backlinks.project_id)
  );

-- Update Phase 2 SEO features policies
DROP POLICY IF EXISTS "Users can access project ranking alerts" ON ranking_alerts;
CREATE POLICY "Users can access project ranking alerts" ON ranking_alerts
  FOR ALL USING (
    public.user_in_project(ranking_alerts.project_id)
  );

DROP POLICY IF EXISTS "Users can access project ranking history" ON ranking_history;
CREATE POLICY "Users can access project ranking history" ON ranking_history
  FOR ALL USING (
    public.user_in_project(ranking_history.project_id)
  );

DROP POLICY IF EXISTS "Users can access project gsc metrics" ON gsc_metrics;
CREATE POLICY "Users can access project gsc metrics" ON gsc_metrics
  FOR ALL USING (
    public.user_in_project(gsc_metrics.project_id)
  );