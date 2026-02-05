-- Fix conflicting RLS policies on relationship tables
-- This removes duplicate/conflicting policies and keeps only the necessary ones

-- ============================================================
-- USERS TABLE - Clean up conflicting policies
-- ============================================================

-- Drop the restrictive "Users can view own profile" policy since we have a broader one
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Keep "Authenticated users can view all profiles" (already exists and working)
-- Keep "Users can update own profile" (already exists and working)

-- ============================================================
-- TASK_ASSIGNMENTS TABLE - Clean up duplicate policies
-- ============================================================

-- Drop the restrictive "Users can view task assignments" since we have a broader one
DROP POLICY IF EXISTS "Users can view task assignments" ON public.task_assignments;

-- Drop the restrictive "Users can manage task assignments" to avoid conflicts
DROP POLICY IF EXISTS "Users can manage task assignments" ON public.task_assignments;

-- Keep "Authenticated users can view task assignments" (allows all to view)
-- Keep "Admins can manage task assignments" (allows authorized roles to manage)

-- ============================================================
-- PROJECT_MEMBERS TABLE - Clean up duplicate policies
-- ============================================================

-- Drop the redundant "Members can view project memberships" since we have broader one
DROP POLICY IF EXISTS "Members can view project memberships" ON public.project_members;

-- Drop the restrictive "Project owners can manage memberships" to simplify
DROP POLICY IF EXISTS "Project owners can manage memberships" ON public.project_members;

-- Keep "Authenticated users can view project memberships" (allows all to view)
-- Keep "Admins can manage project memberships" (allows admins to manage)

-- Add policy for project owners to manage their projects if needed
CREATE POLICY "Project owners can insert members"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
    AND pm2.user_id = auth.uid()
    AND pm2.role = 'owner'
  )
);

CREATE POLICY "Project owners can delete members"
ON public.project_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
    AND pm2.user_id = auth.uid()
    AND pm2.role = 'owner'
  )
);
