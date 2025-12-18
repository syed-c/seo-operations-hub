# Direct Supabase Dashboard Testing Guide

This guide will help you test all Edge functions directly through the Supabase dashboard without needing Docker or any local setup.

## Prerequisites

1. Ensure you've added your actual API keys to the `.env` file in your project
2. Have access to your Supabase project dashboard

## Testing Functions via Supabase Dashboard

### Step 1: Access Your Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project (`mfvyhhoyqfjdwasdjdll`)

### Step 2: Prepare Test Data

Before testing the functions, you'll need some test data in your database:

1. Navigate to the **Table Editor** in your Supabase dashboard
2. Add test data to the following tables:

#### For Rank Checker & Keyword Difficulty Functions:
- Go to the `keywords` table
- Click **Insert row**
- Add these fields:
  - `term`: "seo tools"
  - `project_id`: "test-project"
  - `intent`: "informational"
  - `volume`: 1000
  - Leave `difficulty_score` and `last_difficulty_check` empty for now

#### For Content Audit Function:
- Go to the `pages` table
- Click **Insert row**
- Add these fields:
  - `url`: "https://example.com/test-page"
  - `content`: "This is sample content for testing the content audit function."
  - `project_id`: "test-project"

#### For Technical Audit & Backlink Monitor Functions:
- Go to the `websites` table
- Click **Insert row**
- Add these fields:
  - `url`: "https://example.com"
  - `project_id`: "test-project"
  - `monitoring_enabled`: true (check the box)

- Go to the `pages` table (again)
- Click **Insert row**
- Add these fields:
  - `url`: "https://example.com"
  - `website_id`: (copy the ID from the website you just created)
  - `project_id`: "test-project"

### Step 3: Test Each Function

Navigate to **Functions** in the left sidebar of your Supabase dashboard.

#### 1. Rank Checker Function

1. Click on `rank-checker` in the functions list
2. Click the **Invoke function** button in the top right
3. Observe:
   - The execution log at the bottom
   - Any error messages
4. After execution, verify results:
   - Go to **Table Editor** → `keyword_rankings` table
   - You should see new entries with ranking data

#### 2. Content Audit Function

1. Click on `content-audit` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `audit_results` table
   - Filter where `page_id` is not null
   - You should see new audit results

#### 3. Technical Audit Function

1. Click on `technical-audit` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `audit_results` table
   - Filter where `page_id` is null
   - You should see technical audit results
   - Go to **Table Editor** → `pages` table
   - Check that CWV metrics (cwv_lcp, cwv_cls, cwv_fid) are populated

#### 4. Backlink Monitor Function

1. Click on `backlink-monitor` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `backlinks` table
   - You should see new backlink entries

#### 5. Keyword Difficulty Function

1. Click on `keyword-difficulty` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `keywords` table
   - Check that `difficulty_score` and `last_difficulty_check` are now populated

#### 6. Backlink Crawler Function

1. Click on `backlink-crawler` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `backlinks` table
   - You should see additional backlink entries with `discovered_at` timestamps

#### 7. GSC Analytics Function

1. Click on `gsc-analytics` in the functions list
2. Click the **Invoke function** button
3. Observe the execution log
4. After execution, verify results:
   - Go to **Table Editor** → `gsc_metrics` table
   - You should see new entries with GSC data

## Checking Logs and Debugging

For each function, you can check detailed logs:

1. In the function view, scroll down to the **Logs** section
2. Look for:
   - `console.log` statements
   - Error messages (in red)
   - Execution time
   - Memory usage

Common issues to look for:
- API key errors (401/403 status codes)
- Rate limiting (429 status codes)
- Network timeouts
- Invalid responses from APIs

## Setting Up Scheduled Execution (Cron Jobs)

Once you've verified that functions work correctly, you can set them up to run automatically:

1. In the **Functions** section, click on each function
2. Scroll down to **Cron Jobs**
3. Click **Add cron job**
4. Set schedules:
   - `rank-checker`: Daily (0 0 * * *) - Runs at midnight every day
   - `content-audit`: Weekly (0 0 * * 0) - Runs at midnight every Sunday
   - `technical-audit`: Weekly (0 1 * * 0) - Runs at 1 AM every Sunday
   - `backlink-monitor`: Weekly (0 2 * * 0) - Runs at 2 AM every Sunday
   - `keyword-difficulty`: Monthly (0 3 1 * *) - Runs at 3 AM on the 1st of each month
   - `backlink-crawler`: Weekly (0 4 * * 0) - Runs at 4 AM every Sunday
   - `gsc-analytics`: Daily (30 0 * * *) - Runs at 12:30 AM every day

## Monitoring and Alerts

Set up monitoring for your functions:

1. In the Supabase dashboard, go to **Settings** → **Infrastructure**
2. Enable email alerts for function failures
3. Consider setting up webhook notifications for critical failures

## Expected Results Summary

After running all functions successfully, you should see:

1. **keywords** table:
   - `difficulty_score` values filled (0-100)
   - `last_difficulty_check` timestamps populated

2. **pages** table:
   - `cwv_lcp`, `cwv_cls`, `cwv_fid` values filled
   - `performance_score`, `seo_score`, `accessibility_score` populated
   - Content audit results in `audit_results` table

3. **backlinks** table:
   - Multiple entries with various source URLs
   - Some entries with `toxicity_score` and `spam_reason`
   - Entries marked as `lost` where applicable

4. **gsc_metrics** table:
   - Multiple entries with click, impression, and position data
   - Data spread across different dates

5. **keyword_rankings** table:
   - Ranking data for tracked keywords
   - Historical data for charting

6. **audit_results** table:
   - Both content and technical audit findings
   - Severity levels and recommendations

## Troubleshooting Common Issues

### API Key Issues
- Double-check that all API keys in your Supabase project settings are correct
- Verify keys have proper permissions
- Check for typos or extra spaces

### Rate Limiting
- Many free APIs have strict rate limits
- Functions may need to be run less frequently
- Consider upgrading to paid tiers if you hit limits regularly

### Empty Results
- Some functions return mock data if APIs aren't properly configured
- Check logs for "using mock data" messages
- Verify API keys are working with direct API testing

### Function Timeouts
- Some operations may take longer than the default timeout
- Complex calculations might need optimization
- Check if you're processing too much data at once

## Next Steps After Successful Testing

1. **Adjust Cron Schedules** based on your needs and API limits
2. **Set Up Monitoring** for failures and performance
3. **Review Results** in your dashboard UI
4. **Configure Alerts** for critical issues
5. **Document Operational Procedures** for maintenance

This approach allows you to test and use all Edge functions entirely through the Supabase dashboard without installing anything locally.