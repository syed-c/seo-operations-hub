# Production Deployment Guide

This guide provides detailed instructions for deploying the SEO Operations Hub application to a production environment.

## Environment Variables

Before deploying to production, ensure you have set the following environment variables in your production environment:

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Variable Descriptions

1. `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., https://your-project.supabase.co)
2. `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key for client-side operations
3. `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key for server-side/admin operations

## Supabase Setup

### 1. Project Creation

1. Create a new project in your Supabase dashboard
2. Note down your project URL and keys from the API settings page

### 2. Database Schema

Run the following SQL commands to set up your database schema:

```sql
-- Roles table
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role_id UUID REFERENCES roles(id),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  health_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Websites table
CREATE TABLE websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  pages_count INTEGER,
  health_score INTEGER,
  status VARCHAR(50),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  ranking_position INTEGER,
  content_score INTEGER,
  technical_score INTEGER,
  website_id UUID REFERENCES websites(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Keywords table
CREATE TABLE keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term VARCHAR(255) NOT NULL,
  volume INTEGER,
  difficulty INTEGER,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  priority VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task assignments table
CREATE TABLE task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'ready',
  project_id UUID REFERENCES projects(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Backlinks table
CREATE TABLE backlinks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  strength VARCHAR(20),
  anchor_text TEXT,
  page_id UUID REFERENCES pages(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Keyword rankings table
CREATE TABLE keyword_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_term VARCHAR(255) NOT NULL,
  position INTEGER,
  location VARCHAR(100),
  change INTEGER,
  page_id UUID REFERENCES pages(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Insert Default Roles

```sql
INSERT INTO roles (name) VALUES 
  ('super_admin'),
  ('admin'),
  ('seo_lead'),
  ('content_lead'),
  ('backlink_lead'),
  ('developer'),
  ('designer'),
  ('client'),
  ('viewer');
```

### 4. Row Level Security (RLS)

Enable RLS on all tables and set appropriate policies:

```sql
-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies (example for projects table)
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role_id IN (SELECT id FROM roles WHERE name IN ('super_admin', 'admin', 'seo_lead'))
    )
  );

-- Add similar policies for all tables based on your security requirements
```

## Application Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the environment variables in the Vercel project settings:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist` folder to your preferred hosting provider

## Security Considerations

1. Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client-side code
2. Use the service role key only in secure server-side environments
3. Implement proper Row Level Security (RLS) policies in Supabase
4. Regularly rotate your API keys
5. Use environment-specific keys (different keys for development, staging, and production)

## Super Admin Access

To access the application as a super admin:

1. Set the super admin email in the AuthGate component (`src/components/AuthGate.tsx`)
2. Ensure a user with this email exists in your Supabase users table
3. Assign the 'super_admin' role to this user

Default super admin email is set to: `contact@syedrayyan.com`

## Monitoring and Maintenance

1. Set up error logging with Sentry or a similar service
2. Monitor Supabase usage and performance
3. Regularly backup your database
4. Keep dependencies updated
5. Monitor authentication attempts and set up alerts for suspicious activity

## Troubleshooting

### Common Issues

1. **Authentication failures**: Verify your Supabase keys are correctly set
2. **Database connection errors**: Check your Supabase project URL and network connectivity
3. **Permission denied errors**: Verify RLS policies are correctly configured
4. **Missing data**: Ensure all required tables are created with the correct schema

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify all environment variables are correctly set
4. Ensure your database schema matches the expected structure