-- Populate missing project_members relationships
-- This ensures all existing projects have at least the creator as an owner

-- Insert project members for Super Admins (they should have access to all projects)
INSERT INTO public.project_members (project_id, user_id, role)
SELECT 
    p.id as project_id,
    u.id as user_id,
    'owner' as role
FROM public.projects p
CROSS JOIN public.users u
WHERE u.role = 'Super Admin'
AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p.id
    AND pm.user_id = u.id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Insert project members for Admins (they should have access to all projects)
INSERT INTO public.project_members (project_id, user_id, role)
SELECT 
    p.id as project_id,
    u.id as user_id,
    'admin' as role
FROM public.projects p
CROSS JOIN public.users u
WHERE u.role = 'Admin'
AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p.id
    AND pm.user_id = u.id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- For existing tasks without assignments, create null assignments
-- (this helps maintain referential integrity)
INSERT INTO public.task_assignments (task_id, user_id)
SELECT 
    t.id as task_id,
    NULL as user_id
FROM public.tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM public.task_assignments ta
    WHERE ta.task_id = t.id
)
ON CONFLICT DO NOTHING;

-- Log the results
DO $$
DECLARE
    project_member_count INT;
    task_assignment_count INT;
BEGIN
    SELECT COUNT(*) INTO project_member_count FROM public.project_members;
    SELECT COUNT(*) INTO task_assignment_count FROM public.task_assignments;
    
    RAISE NOTICE 'Total project_members: %', project_member_count;
    RAISE NOTICE 'Total task_assignments: %', task_assignment_count;
END $$;
