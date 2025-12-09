# Edge Function Testing Guide

This guide will help you test all the Edge functions that have been deployed to your Supabase project. Follow these steps to verify that each function is working correctly with your API keys.

## Prerequisites

1. Ensure Docker Desktop is installed and running
2. Start your local Supabase environment:
   ```bash
   cd /media/rayyan/New Volume/Projects/seo-operations-hub
   npx supabase start
   ```
3. Apply database migrations:
   ```bash
   npx supabase migration up
   ```
4. Add your actual API keys to the `.env` file

## Testing Functions Individually

### 1. Rank Checker Function

**Purpose**: Checks keyword rankings using SERPAPI with fallback to free scraper

**Testing Steps**:
1. Add a test keyword to your database:
   ```sql
   INSERT INTO keywords (term, project_id, intent, difficulty, volume)
   VALUES ('your test keyword', 'test-project-id', 'informational', 50, 1000);
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/rank-checker \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results in the `keyword_rankings` table:
   ```sql
   SELECT * FROM keyword_rankings ORDER BY recorded_at DESC LIMIT 5;
   ```

**Expected Results**:
- New entries in `keyword_rankings` table
- Position data populated
- Search volume data captured

### 2. Content Audit Function

**Purpose**: Audits page content using Groq LLM

**Testing Steps**:
1. Add a test page with content:
   ```sql
   INSERT INTO pages (url, content, project_id)
   VALUES ('https://example.com/test-page', 'This is sample content for testing the content audit function.', 'test-project-id');
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/content-audit \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results in the `audit_results` table:
   ```sql
   SELECT * FROM audit_results WHERE page_id IS NOT NULL ORDER BY created_at DESC LIMIT 5;
   ```

**Expected Results**:
- New entries in `audit_results` table
- Content quality assessments
- Readability scores
- Keyword density metrics

### 3. Technical Audit Function

**Purpose**: Performs technical SEO audits using PageSpeed Insights

**Testing Steps**:
1. Add a test website:
   ```sql
   INSERT INTO websites (url, project_id)
   VALUES ('https://example.com', 'test-project-id');
   ```

2. Add a test page for the website:
   ```sql
   INSERT INTO pages (url, website_id, project_id)
   VALUES ('https://example.com', 'website-id-from-above', 'test-project-id');
   ```

3. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/technical-audit \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

4. Check the results:
   ```sql
   -- Check audit results
   SELECT * FROM audit_results WHERE page_id IS NULL ORDER BY created_at DESC LIMIT 5;
   
   -- Check updated page metrics
   SELECT cwv_lcp, cwv_cls, cwv_fid, performance_score, seo_score, accessibility_score 
   FROM pages WHERE url = 'https://example.com';
   ```

**Expected Results**:
- New entries in `audit_results` table for technical issues
- Updated CWV metrics in `pages` table
- Performance, SEO, and accessibility scores populated

### 4. Backlink Monitor Function

**Purpose**: Monitors backlinks using the DIY crawler approach

**Testing Steps**:
1. Ensure you have websites with `monitoring_enabled = true`:
   ```sql
   SELECT * FROM websites WHERE monitoring_enabled = true;
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/backlink-monitor \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results in the `backlinks` table:
   ```sql
   SELECT * FROM backlinks ORDER BY discovered_at DESC LIMIT 10;
   ```

**Expected Results**:
- New backlink entries in the `backlinks` table
- Source URLs populated
- Anchor text captured where available

### 5. Keyword Difficulty Function

**Purpose**: Calculates keyword difficulty using DIY methodology

**Testing Steps**:
1. Add test keywords without difficulty scores:
   ```sql
   INSERT INTO keywords (term, project_id, intent, volume)
   VALUES 
   ('easy keyword', 'test-project-id', 'informational', 1000),
   ('difficult keyword', 'test-project-id', 'transactional', 10000);
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/keyword-difficulty \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results:
   ```sql
   SELECT term, difficulty_score, last_difficulty_check 
   FROM keywords 
   WHERE difficulty_score IS NOT NULL 
   ORDER BY last_difficulty_check DESC;
   ```

**Expected Results**:
- `difficulty_score` values populated (0-100 scale)
- `last_difficulty_check` timestamps updated
- Different scores for different keywords

### 6. Backlink Crawler Function

**Purpose**: Crawls for backlinks using free sources

**Testing Steps**:
1. Ensure you have websites with `monitoring_enabled = true`:
   ```sql
   SELECT * FROM websites WHERE monitoring_enabled = true;
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/backlink-crawler \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results:
   ```sql
   SELECT * FROM backlinks 
   WHERE discovered_at IS NOT NULL 
   ORDER BY discovered_at DESC 
   LIMIT 10;
   ```

**Expected Results**:
- New backlink entries with `discovered_at` timestamps
- Various source URLs from different domains
- Some entries may have `toxicity_score` calculated

### 7. GSC Analytics Function

**Purpose**: Fetches Google Search Console data

**Testing Steps**:
1. Ensure you have websites with `monitoring_enabled = true`:
   ```sql
   SELECT * FROM websites WHERE monitoring_enabled = true;
   ```

2. Invoke the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/gsc-analytics \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Check the results:
   ```sql
   SELECT * FROM gsc_metrics 
   ORDER BY date DESC 
   LIMIT 20;
   ```

**Expected Results**:
- New entries in `gsc_metrics` table
- Click and impression data populated
- CTR and average position metrics
- Data spread across multiple dates

## Testing with Supabase Dashboard

You can also test functions directly through the Supabase Dashboard:

1. Navigate to your Supabase project dashboard
2. Go to "Functions" in the sidebar
3. Select any function
4. Click "Invoke function" in the top right
5. Check the logs for execution results

## Verifying Database Updates

After running all functions, verify the database has been properly updated:

```sql
-- Check keywords with difficulty scores
SELECT COUNT(*) as keywords_with_difficulty 
FROM keywords 
WHERE difficulty_score IS NOT NULL;

-- Check pages with technical metrics
SELECT COUNT(*) as pages_with_cwv 
FROM pages 
WHERE cwv_lcp IS NOT NULL;

-- Check backlinks with toxicity scores
SELECT COUNT(*) as backlinks_with_toxicity 
FROM backlinks 
WHERE toxicity_score IS NOT NULL;

-- Check GSC metrics
SELECT COUNT(*) as gsc_entries 
FROM gsc_metrics;
```

## Troubleshooting Common Issues

### 1. API Key Problems
- Verify all API keys in `.env` file are correct
- Check that keys have proper permissions
- Ensure rate limits haven't been exceeded

### 2. Network/Connectivity Issues
- Confirm internet connectivity
- Check firewall settings
- Verify API endpoints are accessible

### 3. Database Connection Issues
- Ensure Supabase is running locally
- Check service role key is correct
- Verify database schema is up to date

### 4. Function Timeout Issues
- Some functions may take longer to execute with real data
- Check logs for specific error messages
- Consider increasing timeout values if needed

## Monitoring and Logging

All functions log their activities. Check the Supabase function logs for:
- Execution start and completion times
- Error messages
- Debug information
- Performance metrics

## Next Steps After Testing

1. Configure cron jobs for automated execution:
   - `rank-checker`: Daily
   - `content-audit`: Weekly
   - `technical-audit`: Weekly
   - `backlink-monitor`: Weekly
   - `keyword-difficulty`: Monthly
   - `backlink-crawler`: Weekly
   - `gsc-analytics`: Daily

2. Set up monitoring and alerting for:
   - Function failures
   - API rate limit warnings
   - Performance degradation

3. Document the operational procedures for:
   - Regular maintenance
   - API key rotation
   - Function updates

This testing guide should help you verify that all Edge functions are working correctly with your actual API keys and data.