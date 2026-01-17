-- ============================================
-- BACKLINK REPORTS TABLE AND RLS POLICIES
-- Run this migration to create the backlink_reports table
-- ============================================

-- Create backlink_reports table
CREATE TABLE IF NOT EXISTS public.backlink_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('critical', 'warning', 'healthy')),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMP WITH TIME ZONE,
    follow_up_tasks_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add backlink_report_status column to tasks table for badge display
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS backlink_report_status TEXT CHECK (backlink_report_status IS NULL OR backlink_report_status IN ('critical', 'warning', 'healthy'));

-- Add parent_report_id to tasks for linking follow-up tasks to reports
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS parent_report_id UUID REFERENCES public.backlink_reports(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backlink_reports_project_id ON public.backlink_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_assignee_id ON public.backlink_reports(assignee_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_task_id ON public.backlink_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_status ON public.backlink_reports(status);
CREATE INDEX IF NOT EXISTS idx_backlink_reports_created_at ON public.backlink_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_report_id ON public.tasks(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_backlink_report_status ON public.tasks(backlink_report_status);

-- Enable RLS
ALTER TABLE public.backlink_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS FOR RLS
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

-- Function to check user's role (avoid recursion)
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
-- RLS POLICIES FOR BACKLINK_REPORTS
-- ============================================

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

-- Service role insert (for Edge Functions)
CREATE POLICY "Service role can insert backlink_reports"
ON public.backlink_reports
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update backlink_reports"
ON public.backlink_reports
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for backlink_reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.backlink_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backlink_reports_updated_at
    BEFORE UPDATE ON public.backlink_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
