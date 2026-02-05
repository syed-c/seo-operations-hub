-- Test queries to verify data exists and is accessible
-- Run these in Supabase SQL Editor to verify data

-- 1. Check if users exist
SELECT COUNT(*) as user_count FROM public.users;

-- 2. Check if project_members exist
SELECT COUNT(*) as member_count FROM public.project_members;

-- 3. Check if task_assignments exist
SELECT COUNT(*) as assignment_count FROM public.task_assignments;

-- 4. Sample users with their roles
SELECT id, email, first_name, last_name, role 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Sample project_members with user info
SELECT 
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role as member_role,
    u.email,
    u.first_name,
    u.last_name,
    u.role as user_role
FROM public.project_members pm
LEFT JOIN public.users u ON pm.user_id = u.id
LIMIT 10;

-- 6. Sample task_assignments with user info
SELECT 
    ta.id,
    ta.task_id,
    ta.user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role
FROM public.task_assignments ta
LEFT JOIN public.users u ON ta.user_id = u.id
LIMIT 10;

-- 7. Test the RLS policies by simulating an authenticated user query
-- Replace 'YOUR_USER_ID' with an actual user ID from your database
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub TO 'YOUR_USER_ID';
-- SELECT * FROM public.users LIMIT 5;
