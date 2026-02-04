-- Migration for Job System (Production Hardening)

-- 1. Create Enums
CREATE TYPE public.job_status AS ENUM ('queued', 'processing', 'partial', 'completed', 'failed');
CREATE TYPE public.log_level AS ENUM ('info', 'warn', 'error');

-- 2. Create 'jobs' table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'weekly_audit', 'onboarding'
    status public.job_status NOT NULL DEFAULT 'queued',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- 3. Create 'job_state' table (One-to-One with jobs)
CREATE TABLE IF NOT EXISTS public.job_state (
    job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
    cursor JSONB DEFAULT '{}'::jsonb, -- Store Resume position (e.g., last_url, offset)
    batch_progress JSONB DEFAULT '{}'::jsonb, -- Store stats like { processed: 10, total: 50 }
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create 'execution_logs' table
CREATE TABLE IF NOT EXISTS public.execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    level public.log_level NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb, -- Cost, tokens, runtime duration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_job_id ON public.execution_logs(job_id);

-- 6. RLS Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Admins and Leads can view project jobs" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = jobs.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Service Role (Edge Functions) has full access by default, but we can be explicit if needed.
-- (Supabase Service Role key bypasses RLS, so no specific policy needed for backend management)

-- Job State Policies
CREATE POLICY "Admins and Leads can view job state" ON public.job_state
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            JOIN public.project_members pm ON j.project_id = pm.project_id
            WHERE j.id = job_state.job_id
            AND pm.user_id = auth.uid()
        )
    );

-- Execution Logs Policies
CREATE POLICY "Admins and Leads can view execution logs" ON public.execution_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            JOIN public.project_members pm ON j.project_id = pm.project_id
            WHERE j.id = execution_logs.job_id
            AND pm.user_id = auth.uid()
        )
    );

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_state;
