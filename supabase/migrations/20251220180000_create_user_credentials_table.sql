-- Create user_credentials table for team login functionality
-- This table stores password hashes for team members who can log in via the team auth system

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_set_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on user_credentials table
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credentials

-- Users can view their own credentials
DROP POLICY IF EXISTS "Users can view own credentials" ON user_credentials;
CREATE POLICY "Users can view own credentials" ON user_credentials
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all credentials (via Edge Functions)
DROP POLICY IF EXISTS "Admins can manage all credentials" ON user_credentials;
CREATE POLICY "Admins can manage all credentials" ON user_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  );

-- Add a comment to explain the purpose of the table
COMMENT ON TABLE user_credentials IS 'Stores password hashes for team members who can log in via the team authentication system';