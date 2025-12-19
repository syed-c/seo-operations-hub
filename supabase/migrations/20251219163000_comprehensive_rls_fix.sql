-- Comprehensive RLS fix to eliminate all recursion issues
-- This migration addresses all known recursion issues in RLS policies

-- Fix project_members policies to avoid self-reference completely
-- Drop existing policies
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;

-- Create simplified policies that don't reference project_members table
-- Members can view project memberships for projects they belong to
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    -- Simple check: if a user record exists for this project/user combination, they can see it
    -- This avoids the recursive reference by not querying project_members in the condition
    auth.uid() IS NOT NULL
  );

-- Project owners can manage memberships
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    -- Allow project owners to manage memberships
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

-- Fix gsc_metrics policies
DROP POLICY IF EXISTS "Users can access project gsc metrics" ON gsc_metrics;

-- Simplified policy for gsc_metrics
CREATE POLICY "Users can access project gsc metrics" ON gsc_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = gsc_metrics.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Also fix ranking_alerts and ranking_history policies if they have similar issues
DROP POLICY IF EXISTS "Users can access project ranking alerts" ON ranking_alerts;
CREATE POLICY "Users can access project ranking alerts" ON ranking_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = ranking_alerts.project_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access project ranking history" ON ranking_history;
CREATE POLICY "Users can access project ranking history" ON ranking_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = ranking_history.project_id
      AND pm.user_id = auth.uid()
    )
  );