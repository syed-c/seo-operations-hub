# Cron Jobs Setup for SEO Operations Hub

This document provides the SQL commands to set up automated cron jobs for your SEO Operations Hub.

## Prerequisites

Before setting up cron jobs, ensure the following extensions are enabled in your Supabase project:

1. **pg_cron** - For scheduling jobs
2. **pg_net** - For making HTTP requests

To enable these extensions, run in the SQL Editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Create Automation Logs Table

First, create a table to track automation runs:

```sql
-- Create automation_logs table if not exists
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
CREATE POLICY "Users can view automation logs" ON public.automation_logs
    FOR SELECT TO authenticated USING (true);
```

## Set Up Cron Jobs

Run these SQL commands in your Supabase SQL Editor to set up automated tasks:

### Daily Rank Checker (Runs at midnight UTC)

```sql
SELECT cron.schedule(
    'daily-rank-checker',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url := 'https://mfvyhhoyqfjdwasdjdll.supabase.co/functions/v1/rank-checker',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdnloaG95cWZqZHdhc2RqZGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTIxNzEsImV4cCI6MjA4MDc2ODE3MX0.24D4NAIEOz-lfTFe_hm39WGK-6pKU4LGFVLC4x_KNao"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) AS request_id;
    $$
);
```

### Daily Backlink Monitor (Runs at 1 AM UTC)

```sql
SELECT cron.schedule(
    'daily-backlink-monitor',
    '0 1 * * *',
    $$
    SELECT net.http_post(
        url := 'https://mfvyhhoyqfjdwasdjdll.supabase.co/functions/v1/backlink-monitor',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdnloaG95cWZqZHdhc2RqZGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTIxNzEsImV4cCI6MjA4MDc2ODE3MX0.24D4NAIEOz-lfTFe_hm39WGK-6pKU4LGFVLC4x_KNao"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) AS request_id;
    $$
);
```

### Weekly Content Audit (Runs at 2 AM UTC on Sundays)

```sql
SELECT cron.schedule(
    'weekly-content-audit',
    '0 2 * * 0',
    $$
    SELECT net.http_post(
        url := 'https://mfvyhhoyqfjdwasdjdll.supabase.co/functions/v1/content-audit',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdnloaG95cWZqZHdhc2RqZGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTIxNzEsImV4cCI6MjA4MDc2ODE3MX0.24D4NAIEOz-lfTFe_hm39WGK-6pKU4LGFVLC4x_KNao"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) AS request_id;
    $$
);
```

### Weekly Technical Audit (Runs at 3 AM UTC on Sundays)

```sql
SELECT cron.schedule(
    'weekly-technical-audit',
    '0 3 * * 0',
    $$
    SELECT net.http_post(
        url := 'https://mfvyhhoyqfjdwasdjdll.supabase.co/functions/v1/technical-audit',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdnloaG95cWZqZHdhc2RqZGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTIxNzEsImV4cCI6MjA4MDc2ODE3MX0.24D4NAIEOz-lfTFe_hm39WGK-6pKU4LGFVLC4x_KNao"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) AS request_id;
    $$
);
```

## Manage Cron Jobs

### View All Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### View Job Run History

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

### Unschedule a Job

```sql
SELECT cron.unschedule('daily-rank-checker');
```

## Cron Expression Reference

| Expression | Description |
|------------|-------------|
| `0 0 * * *` | Every day at midnight |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 0 1 * *` | First day of every month |
| `*/30 * * * *` | Every 30 minutes |

## Monitoring

Check the `automation_logs` table to monitor function executions:

```sql
SELECT * FROM automation_logs ORDER BY executed_at DESC LIMIT 20;
```

## Troubleshooting

1. **Jobs not running**: Ensure pg_cron and pg_net extensions are enabled
2. **Function errors**: Check Supabase Edge Functions logs
3. **Network errors**: Verify the function URL and authorization header
