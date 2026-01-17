-- ============================================
-- BACKLINK REPORTS MIGRATION - PART 1: TABLES
-- Run each section separately if you encounter errors
-- ============================================

-- 1. Create backlink_reports table
CREATE TABLE IF NOT EXISTS public.backlink_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID,
    project_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('critical', 'warning', 'healthy')),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMP WITH TIME ZONE,
    follow_up_tasks_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 2: ADD COLUMNS TO TASKS TABLE
-- ============================================

-- Add backlink_report_status column to tasks table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'backlink_report_status'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN backlink_report_status TEXT 
        CHECK (backlink_report_status IS NULL OR backlink_report_status IN ('critical', 'warning', 'healthy'));
    END IF;
END $$;

-- Add parent_report_id to tasks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'parent_report_id'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN parent_report_id UUID;
    END IF;
END $$;

-- ============================================
-- PART 3: ADD FOREIGN KEYS (run after tables exist)
-- ============================================

-- Add foreign keys to backlink_reports if not exist
DO $$
BEGIN
    -- FK to tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_task_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
    END IF;
    
    -- FK to projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_project_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    -- FK to auth.users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_assignee_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_assignee_id_fkey 
        FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK for notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK for tasks.parent_report_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_parent_report_id_fkey'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_parent_report_id_fkey 
        FOREIGN KEY (parent_report_id) REFERENCES public.backlink_reports(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- PART 4: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_backlink_reports_project_id ON public.backlink_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_assignee_id ON public.backlink_reports(assignee_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_task_id ON public.backlink_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_status ON public.backlink_reports(status);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_created_at ON public.backlink_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_report_id ON public.tasks(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_backlink_report_status ON public.tasks(backlink_report_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- PART 5: ENABLE RLS
-- ============================================

ALTER TABLE public.backlink_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user is a project member
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.project_members
        WHERE user_id = _user_id
          AND project_id = _project_id
    )
$$;

-- Function to get user's role (avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = _user_id
$$;

-- ============================================
-- PART 7: RLS POLICIES FOR BACKLINK_REPORTS
-- ============================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Super Admin and Admin full access to backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "Manager can view project backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "SEO Lead can view project backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "Backlink Lead can view own backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "Client readonly access to project backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "Service role can insert backlink_reports" ON public.backlink_reports;
DROP POLICY IF EXISTS "Service role can update backlink_reports" ON public.backlink_reports;

-- Super Admin & Admin: Full access
CREATE POLICY "Super Admin and Admin full access to backlink_reports"
ON public.backlink_reports
FOR ALL
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('Super Admin', 'Admin')
)
WITH CHECK (
    public.get_user_role(auth.uid()) IN ('Super Admin', 'Admin')
);

-- Manager: Can view reports for projects they manage
CREATE POLICY "Manager can view project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Manager'
    AND public.is_project_member(auth.uid(), project_id)
);

-- SEO Lead: Can view all reports in their assigned projects
CREATE POLICY "SEO Lead can view project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'SEO Lead'
    AND public.is_project_member(auth.uid(), project_id)
);

-- Backlink Lead: Can view their own reports
CREATE POLICY "Backlink Lead can view own backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Backlink Lead'
    AND assignee_id = auth.uid()
);

-- Client: Can view reports for their assigned projects (readonly)
CREATE POLICY "Client readonly access to project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Client'
    AND public.is_project_member(auth.uid(), project_id)
);

-- ============================================
-- PART 8: RLS POLICIES FOR NOTIFICATIONS
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- PART 9: UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_backlink_reports_updated_at ON public.backlink_reports;
CREATE TRIGGER update_backlink_reports_updated_at
    BEFORE UPDATE ON public.backlink_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 10: REALTIME (optional - run if needed)
-- ============================================

-- Enable realtime for tables (ignore errors if already enabled)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.backlink_reports;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
