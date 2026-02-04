-- Migration for Backlink Reports and Automation System

-- 1. Create backlink_reports table if not exists with BASE columns
-- If table exists, this is skipped, so we must verify columns exist separately
CREATE TABLE IF NOT EXISTS public.backlink_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID,
    project_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('critical', 'warning', 'healthy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure ALL columns exist (for compatibility with existing table)
DO $$
BEGIN
    -- Core columns that might be missing if table was created differently
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'created_at') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'updated_at') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'status') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN status TEXT CHECK (status IN ('critical', 'warning', 'healthy'));
    END IF;

    -- Add summary if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'summary') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN summary JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add payload if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'payload') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN payload JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add processed_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'processed_at') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add follow_up_tasks_created if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'follow_up_tasks_created') THEN
        ALTER TABLE public.backlink_reports ADD COLUMN follow_up_tasks_created BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL, -- e.g., 'backlink_report', 'task_assigned'
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist for notifications (in case table pre-existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
        ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
         ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Add columns to tasks table
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

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'parent_report_id'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN parent_report_id UUID;
    END IF;
END $$;

-- 4. Add constraints and foreign keys
DO $$
BEGIN
    -- FK for backlink_reports.task_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_task_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
    END IF;
    
    -- FK for backlink_reports.project_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_project_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    -- FK for backlink_reports.assignee_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backlink_reports_assignee_id_fkey'
    ) THEN
        ALTER TABLE public.backlink_reports 
        ADD CONSTRAINT backlink_reports_assignee_id_fkey 
        FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- FK for notifications.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- FK for tasks.parent_report_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_parent_report_id_fkey'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_parent_report_id_fkey 
        FOREIGN KEY (parent_report_id) REFERENCES public.backlink_reports(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Create Indexes (safe creation)
CREATE INDEX IF NOT EXISTS idx_backlink_reports_project_id ON public.backlink_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_assignee_id ON public.backlink_reports(assignee_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_task_id ON public.backlink_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_status ON public.backlink_reports(status);

-- Only create created_at index if column exists (it should now, but extra safe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'backlink_reports' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_backlink_reports_created_at ON public.backlink_reports(created_at DESC);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_report_id ON public.tasks(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Safe index for notifications.read
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
    END IF;
END $$;



-- 6. Enable RLS
ALTER TABLE public.backlink_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Helper function for role checking (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = _user_id
$$;

-- Helper function for project membership (if not exists)
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

-- Policies for backlink_reports

-- Super Admin & Admin: Full access
DROP POLICY IF EXISTS "Super Admin and Admin full access to backlink_reports" ON public.backlink_reports;
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
DROP POLICY IF EXISTS "Manager can view project backlink_reports" ON public.backlink_reports;
CREATE POLICY "Manager can view project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Manager'
    AND public.is_project_member(auth.uid(), project_id)
);

-- SEO Lead: Can view all reports in their assigned projects
DROP POLICY IF EXISTS "SEO Lead can view project backlink_reports" ON public.backlink_reports;
CREATE POLICY "SEO Lead can view project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'SEO Lead'
    AND public.is_project_member(auth.uid(), project_id)
);

-- Backlink Lead: Can view their own reports
DROP POLICY IF EXISTS "Backlink Lead can view own backlink_reports" ON public.backlink_reports;
CREATE POLICY "Backlink Lead can view own backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Backlink Lead'
    AND assignee_id = auth.uid()
);

-- Client: Readonly for their projects
DROP POLICY IF EXISTS "Client readonly access to project backlink_reports" ON public.backlink_reports;
CREATE POLICY "Client readonly access to project backlink_reports"
ON public.backlink_reports
FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'Client'
    AND public.is_project_member(auth.uid(), project_id)
);

-- Policies for notifications

-- Policies for notifications

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8. Enable Realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.backlink_reports;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
