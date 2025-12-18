# Phase 2 Cron Jobs Setup Guide

This document provides instructions for setting up the cron jobs for your SEO Operations Hub Phase 2 features.

## Deployed Functions

The following functions have been successfully deployed:
1. `rank-checker` - Checks keyword rankings using SerpAPI or DataForSEO
2. `content-audit` - Performs automated content audits using OpenAI
3. `backlink-monitor` - Monitors backlinks using Ahrefs/Moz/Semrush
4. `technical-audit` - Performs technical SEO audits using Lighthouse/PageSpeed

## Setting Up Cron Jobs

To set up cron jobs for these functions, follow these steps:

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project (`mfvyhhoyqfjdwasdjdll`)

### 2. Navigate to Functions Section
1. In the left sidebar, click on "Functions"
2. Click on "Hooks" tab

### 3. Create Cron Jobs

#### Rank Checker Cron Job
- **Function**: `rank-checker`
- **Frequency**: Daily (0 0 * * *) - Runs at midnight UTC
- **Payload**: Leave empty or add any specific configuration

#### Content Audit Cron Job
- **Function**: `content-audit`
- **Frequency**: Weekly (0 0 * * 0) - Runs at midnight on Sundays UTC
- **Payload**: Leave empty or add any specific configuration

#### Backlink Monitor Cron Job
- **Function**: `backlink-monitor`
- **Frequency**: Daily (0 1 * * *) - Runs at 1 AM UTC
- **Payload**: Leave empty or add any specific configuration

#### Technical Audit Cron Job
- **Function**: `technical-audit`
- **Frequency**: Weekly (0 2 * * 0) - Runs at 2 AM on Sundays UTC
- **Payload**: Leave empty or add any specific configuration

## Cron Expression Reference

For custom scheduling, use these cron expression patterns:
- Every hour: `0 * * * *`
- Twice daily: `0 0,12 * * *`
- Every Monday at 9 AM: `0 9 * * 1`
- First day of month: `0 0 1 * *`

## Environment Variables

Make sure to set up the following environment variables in your Supabase project:

1. **SERPAPI_KEY** - For SerpAPI integration (rank-checker)
2. **DATAFORSEO_LOGIN** and **DATAFORSEO_PASSWORD** - For DataForSEO integration (rank-checker)
3. **OPENAI_API_KEY** - For OpenAI integration (content-audit)
4. **AHREFS_API_KEY** - For Ahrefs integration (backlink-monitor)
5. **MOZ_ACCESS_ID** and **MOZ_SECRET_KEY** - For Moz integration (backlink-monitor)
6. **PAGESPEED_API_KEY** - For PageSpeed Insights integration (technical-audit)

To set environment variables:
1. In Supabase dashboard, go to "Settings" → "Configuration" → "Environment Variables"
2. Click "Add new variable"
3. Enter the variable name and value
4. Click "Save"

## Testing Functions

You can test any function manually by:
1. Going to the "Functions" section in Supabase dashboard
2. Clicking on the function name
3. Using the "Invoke function" button in the top right
4. Providing any required payload (usually empty for our cron functions)

## Monitoring

Monitor function executions in:
1. Supabase dashboard → "Functions" → "Logs"
2. Check for any errors or failed executions
3. Set up alerts for function failures if needed

## Next Steps

1. Set up the cron jobs as described above
2. Configure the required API keys for third-party services
3. Test each function manually to ensure proper operation
4. Monitor the first few automated runs to verify everything works correctly