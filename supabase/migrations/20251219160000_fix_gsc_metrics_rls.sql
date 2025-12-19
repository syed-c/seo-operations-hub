-- Fix RLS policies for gsc_metrics table to avoid recursion
-- This migration fixes the infinite recursion issue in gsc_metrics RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access project gsc metrics" ON gsc_metrics;
DROP POLICY IF EXISTS "Admins can manage all gsc metrics" ON gsc_metrics;

-- Create improved policies using EXISTS instead of IN with subquery
-- Users can access project gsc metrics
CREATE POLICY "Users can access project gsc metrics" ON gsc_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = gsc_metrics.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Admins can manage all gsc metrics
CREATE POLICY "Admins can manage all gsc metrics" ON gsc_metrics
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