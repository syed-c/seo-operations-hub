-- Enable RLS on relationship tables and add necessary policies
-- This fixes the issue where team members and assignments are not visible

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on project_members table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on task_assignments table
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Members can view project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage memberships" ON public.project_members;
DROP POLICY IF EXISTS "Admins can manage project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Users can view task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can manage task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Admins can manage task assignments" ON public.task_assignments;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Allow authenticated users to view all user profiles (needed for team member lookups)
CREATE POLICY "Authenticated users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- PROJECT_MEMBERS TABLE POLICIES
-- ============================================================

-- Allow all authenticated users to view project memberships
-- This is essential for displaying team members in dropdowns and listings
CREATE POLICY "Authenticated users can view project memberships"
ON public.project_members
FOR SELECT
TO authenticated
USING (true);

-- Project members can view memberships for their own projects
CREATE POLICY "Members can view project memberships"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
    AND pm2.user_id = auth.uid()
  )
);

-- Project owners can manage memberships
CREATE POLICY "Project owners can manage memberships"
ON public.project_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
    AND pm2.user_id = auth.uid()
    AND pm2.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
    AND pm2.user_id = auth.uid()
    AND pm2.role = 'owner'
  )
);

-- Admins can manage all project memberships
CREATE POLICY "Admins can manage project memberships"
ON public.project_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('Super Admin', 'Admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('Super Admin', 'Admin')
  )
);

-- ============================================================
-- TASK_ASSIGNMENTS TABLE POLICIES
-- ============================================================

-- Allow all authenticated users to view task assignments
-- This is essential for displaying assignees in task lists
CREATE POLICY "Authenticated users can view task assignments"
ON public.task_assignments
FOR SELECT
TO authenticated
USING (true);

-- Users can view their own task assignments
CREATE POLICY "Users can view task assignments"
ON public.task_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can manage their own task assignments
CREATE POLICY "Users can manage task assignments"
ON public.task_assignments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can manage all task assignments
CREATE POLICY "Admins can manage task assignments"
ON public.task_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('Super Admin', 'Admin', 'SEO Lead', 'Content Lead', 'Backlink Lead')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('Super Admin', 'Admin', 'SEO Lead', 'Content Lead', 'Backlink Lead')
  )
);
