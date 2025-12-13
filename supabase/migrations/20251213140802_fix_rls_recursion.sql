-- Fix RLS recursion issues in project_members table

-- Fix project_members policies to avoid self-reference
DROP POLICY IF EXISTS "Members can view project memberships" ON project_members;
CREATE POLICY "Members can view project memberships" ON project_members
  FOR SELECT USING (
    -- Allow users to see memberships for projects they're part of
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners can manage memberships" ON project_members;
CREATE POLICY "Project owners can manage memberships" ON project_members
  FOR ALL USING (
    -- Allow project owners to manage memberships
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
      AND pm2.role = 'owner'
    )
  );

-- Fix keyword_rankings policy to avoid JOIN with project_members
DROP POLICY IF EXISTS "Users can access project keyword rankings" ON keyword_rankings;
CREATE POLICY "Users can access project keyword rankings" ON keyword_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM keywords k
      WHERE k.id = keyword_rankings.keyword_id
      AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = k.project_id
        AND pm.user_id = auth.uid()
      )
    )
  );