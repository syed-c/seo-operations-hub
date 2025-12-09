# Phase 2 Dashboard Setup Guide

This document provides step-by-step instructions for setting up cron jobs and configuring API keys through the Supabase dashboard.

## Setting Up Cron Jobs

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (`mfvyhhoyqfjdwasdjdll`)

### 2. Navigate to Functions Section
1. In the left sidebar, click on "Functions"
2. Click on "Hooks" tab

### 3. Create Cron Jobs

#### Rank Checker Cron Job
1. Click "New hook"
2. Set the following parameters:
   - **Event type**: `Cron job`
   - **Function**: `rank-checker`
   - **Schedule**: `0 0 * * *` (Runs daily at midnight UTC)
   - **Name**: `daily-rank-check`
3. Click "Save"

#### Content Audit Cron Job
1. Click "New hook"
2. Set the following parameters:
   - **Event type**: `Cron job`
   - **Function**: `content-audit`
   - **Schedule**: `0 0 * * 0` (Runs weekly at midnight on Sundays UTC)
   - **Name**: `weekly-content-audit`
3. Click "Save"

#### Backlink Monitor Cron Job
1. Click "New hook"
2. Set the following parameters:
   - **Event type**: `Cron job`
   - **Function**: `backlink-monitor`
   - **Schedule**: `0 1 * * *` (Runs daily at 1 AM UTC)
   - **Name**: `daily-backlink-monitor`
3. Click "Save"

#### Technical Audit Cron Job
1. Click "New hook"
2. Set the following parameters:
   - **Event type**: `Cron job`
   - **Function**: `technical-audit`
   - **Schedule**: `0 2 * * 0` (Runs weekly at 2 AM on Sundays UTC)
   - **Name**: `weekly-technical-audit`
3. Click "Save"

## Configuring API Keys

### 1. Access Environment Variables Section
1. In the Supabase dashboard, click on "Settings" in the left sidebar
2. Click on "Configuration"
3. Click on "Environment Variables"

### 2. Add Required API Keys

#### SerpAPI Key (for Rank Checker)
1. Click "Add new variable"
2. Set:
   - **Name**: `SERPAPI_KEY`
   - **Value**: Your actual SerpAPI key
3. Click "Save"

#### DataForSEO Credentials (Alternative for Rank Checker)
1. Click "Add new variable"
2. Set:
   - **Name**: `DATAFORSEO_LOGIN`
   - **Value**: Your DataForSEO login
3. Click "Save"
4. Click "Add new variable"
5. Set:
   - **Name**: `DATAFORSEO_PASSWORD`
   - **Value**: Your DataForSEO password
6. Click "Save"

#### OpenAI API Key (for Content Audit)
1. Click "Add new variable"
2. Set:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key
3. Click "Save"

#### Ahrefs API Key (for Backlink Monitor)
1. Click "Add new variable"
2. Set:
   - **Name**: `AHREFS_API_KEY`
   - **Value**: Your actual Ahrefs API key
3. Click "Save"

#### Moz Credentials (Alternative for Backlink Monitor)
1. Click "Add new variable"
2. Set:
   - **Name**: `MOZ_ACCESS_ID`
   - **Value**: Your Moz access ID
3. Click "Save"
4. Click "Add new variable"
5. Set:
   - **Name**: `MOZ_SECRET_KEY`
   - **Value**: Your Moz secret key
6. Click "Save"

#### PageSpeed API Key (for Technical Audit)
1. Click "Add new variable"
2. Set:
   - **Name**: `PAGESPEED_API_KEY`
   - **Value**: Your actual PageSpeed API key
3. Click "Save"

## Testing Functions Manually

### 1. Access Functions Section
1. In the Supabase dashboard, click on "Functions" in the left sidebar
2. You'll see a list of your deployed functions

### 2. Test Each Function
#### Rank Checker
1. Click on "rank-checker" in the functions list
2. Click the "Invoke function" button in the top right
3. Leave the payload empty (just `{}`)
4. Click "Invoke"
5. Check the response and logs

#### Content Audit
1. Click on "content-audit" in the functions list
2. Click the "Invoke function" button in the top right
3. Leave the payload empty (just `{}`)
4. Click "Invoke"
5. Check the response and logs

#### Backlink Monitor
1. Click on "backlink-monitor" in the functions list
2. Click the "Invoke function" button in the top right
3. Leave the payload empty (just `{}`)
4. Click "Invoke"
5. Check the response and logs

#### Technical Audit
1. Click on "technical-audit" in the functions list
2. Click the "Invoke function" button in the top right
3. Leave the payload empty (just `{}`)
4. Click "Invoke"
5. Check the response and logs

## Monitoring Function Executions

### 1. View Function Logs
1. In the Supabase dashboard, click on "Functions" in the left sidebar
2. Click on "Logs" tab
3. You can filter by function name and time range
4. Look for any errors or failed executions

### 2. Set Up Alerts (Optional)
1. In the Supabase dashboard, click on "Alerts" in the left sidebar
2. Click "New alert"
3. Configure alerts for:
   - Function failures
   - High error rates
   - Slow function executions

## Verifying Database Updates

### 1. Check New Tables
1. In the Supabase dashboard, click on "Table Editor" in the left sidebar
2. Verify the following tables exist:
   - `ranking_history`
   - `ranking_alerts`

### 2. Check Updated Tables
1. In the Table Editor, check that the following tables have new columns:
   - `keywords`: `last_checked`, `target_position`, `tags`
   - `pages`: `content`, `word_count`, `last_audited`
   - `websites`: `last_technical_audit`, `monitoring_enabled`

## Next Steps

1. Wait for the first automated cron job executions
2. Monitor the logs for any errors
3. Check the database for new entries in ranking_history, ranking_alerts, etc.
4. Begin connecting the frontend UI to display the new data

## Troubleshooting

### Common Issues

#### Function Execution Failures
- Check that all required API keys are configured
- Verify API keys are valid and have sufficient quota
- Check function logs for specific error messages

#### Database Issues
- Ensure the migration was applied successfully
- Check that RLS policies are working correctly
- Verify table relationships and foreign key constraints

#### Cron Job Issues
- Confirm cron expressions are valid
- Check that functions are not timing out
- Verify the Supabase project has sufficient resources

### Getting Help
If you encounter issues:
1. Check the Supabase documentation
2. Review function logs for detailed error messages
3. Contact Supabase support if needed