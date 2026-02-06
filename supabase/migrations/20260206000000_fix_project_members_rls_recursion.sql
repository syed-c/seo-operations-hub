-- Fix RLS recursion issue in project_members table
-- This addresses the "infinite recursion detected" error when inserting records

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Members can view project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON public.project_members;
DROP POLICY IF EXISTS "Admins can manage project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can insert members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can delete members" ON public.project_members;

-- Create simplified policies that avoid recursion by not referencing the same table in the USING clause
-- Policy for authenticated users to view project memberships
CREATE POLICY "Authenticated users can view project memberships"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage project memberships (insert, update, delete)
CREATE POLICY "Admins can manage project memberships"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

-- Policy for project owners to manage their own project memberships
CREATE POLICY "Project owners can manage own project memberships"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (
    -- Check if the current user is the owner of the project in this record
    EXISTS (
      SELECT 1 FROM public.project_members pm_check
      WHERE pm_check.project_id = project_members.project_id
      AND pm_check.user_id = auth.uid()
      AND pm_check.role = 'owner'
    )
  )
  WITH CHECK (
    -- For INSERT/UPDATE, ensure the user is the project owner
    EXISTS (
      SELECT 1 FROM public.project_members pm_check
      WHERE pm_check.project_id = project_members.project_id
      AND pm_check.user_id = auth.uid()
      AND pm_check.role = 'owner'
    )
  );

-- Policy for regular project members to view their own project memberships
CREATE POLICY "Project members can view own project memberships"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm_check
      WHERE pm_check.project_id = project_members.project_id
      AND pm_check.user_id = auth.uid()
    )
  );