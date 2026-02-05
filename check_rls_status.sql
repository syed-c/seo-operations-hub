-- Check RLS status and policies for relationship tables
-- Run this in Supabase SQL Editor to diagnose the issue

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'project_members', 'task_assignments')
ORDER BY tablename;

-- Check existing policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'project_members', 'task_assignments')
ORDER BY tablename, policyname;
