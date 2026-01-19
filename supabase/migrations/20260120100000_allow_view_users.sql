-- Enable users to view other users' profiles (essential for collaboration features)
-- This fixes the "Unknown User" issue where joins with users table return null

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

CREATE POLICY "Authenticated users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);
