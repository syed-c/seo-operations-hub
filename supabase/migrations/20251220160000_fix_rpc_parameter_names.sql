-- Fix RPC parameter names to match frontend expectations
-- Drop existing functions first

DROP FUNCTION IF EXISTS public.get_analytics_summary(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_top_pages(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_other_pages_aggregate(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_all_pages(uuid, date, date, text);

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  project_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  total_clicks bigint,
  total_impressions bigint,
  avg_ctr numeric,
  avg_position numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  COALESCE(SUM(clicks), 0)::bigint,
  COALESCE(SUM(impressions), 0)::bigint,
  CASE
    WHEN COALESCE(SUM(impressions), 0) = 0 THEN 0
    ELSE SUM(clicks)::numeric / SUM(impressions)
  END,
  CASE
    WHEN COALESCE(SUM(impressions), 0) = 0 THEN 0
    ELSE SUM(avg_position * impressions) / SUM(impressions)
  END
FROM gsc_metrics
WHERE gsc_metrics.project_id = project_id
AND date BETWEEN start_date AND end_date;
$$;

-- Function to get top 10 performing pages
CREATE OR REPLACE FUNCTION public.get_top_pages(
  project_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  page_url text,
  clicks bigint,
  impressions bigint,
  ctr numeric,
  avg_position numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  gsc_metrics.page_url,
  COALESCE(SUM(gsc_metrics.clicks), 0)::bigint AS clicks,
  COALESCE(SUM(gsc_metrics.impressions), 0)::bigint AS impressions,
  CASE 
    WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
    THEN (SUM(gsc_metrics.clicks)::numeric / SUM(gsc_metrics.impressions))
    ELSE 0
  END AS ctr,
  CASE 
    WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
    THEN (SUM(gsc_metrics.avg_position * gsc_metrics.impressions) / SUM(gsc_metrics.impressions))
    ELSE 0
  END AS avg_position
FROM gsc_metrics
WHERE gsc_metrics.project_id = project_id
AND date BETWEEN start_date AND end_date
GROUP BY gsc_metrics.page_url
ORDER BY SUM(gsc_metrics.clicks) DESC, SUM(gsc_metrics.impressions) DESC
LIMIT 10;
$$;

-- Function to get aggregated "other pages" metrics
CREATE OR REPLACE FUNCTION public.get_other_pages_aggregate(
  project_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  clicks bigint,
  impressions bigint,
  ctr numeric,
  avg_position numeric
)
LANGUAGE sql
STABLE
AS $$
WITH top_pages AS (
  SELECT page_url
  FROM gsc_metrics
  WHERE gsc_metrics.project_id = project_id
  AND date BETWEEN start_date AND end_date
  GROUP BY page_url
  ORDER BY SUM(clicks) DESC, SUM(impressions) DESC
  LIMIT 10
),
filtered_pages AS (
  SELECT *
  FROM gsc_metrics
  WHERE gsc_metrics.project_id = project_id
  AND date BETWEEN start_date AND end_date
  AND gsc_metrics.page_url NOT IN (SELECT COALESCE(page_url, '') FROM top_pages WHERE page_url IS NOT NULL)
)
SELECT
  COALESCE(SUM(clicks), 0)::bigint AS clicks,
  COALESCE(SUM(impressions), 0)::bigint AS impressions,
  CASE 
    WHEN COALESCE(SUM(impressions), 0) >= 50  -- Minimum threshold for reliable CTR
    THEN (SUM(clicks)::numeric / SUM(impressions))
    ELSE 0  -- Return 0 for unreliable CTR
  END AS ctr,
  CASE 
    WHEN COALESCE(SUM(impressions), 0) > 0 
    THEN (SUM(avg_position * impressions) / SUM(impressions))
    ELSE 0
  END AS avg_position
FROM filtered_pages;
$$;

-- Function to get all pages (for detailed view with pagination)
CREATE OR REPLACE FUNCTION public.get_all_pages(
  project_id uuid,
  start_date date,
  end_date date,
  filter_text text DEFAULT ''
)
RETURNS TABLE (
  page_url text,
  clicks bigint,
  impressions bigint,
  ctr numeric,
  avg_position numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  gsc_metrics.page_url,
  COALESCE(SUM(gsc_metrics.clicks), 0)::bigint AS clicks,
  COALESCE(SUM(gsc_metrics.impressions), 0)::bigint AS impressions,
  CASE 
    WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
    THEN (SUM(gsc_metrics.clicks)::numeric / SUM(gsc_metrics.impressions))
    ELSE 0
  END AS ctr,
  CASE 
    WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
    THEN (SUM(gsc_metrics.avg_position * gsc_metrics.impressions) / SUM(gsc_metrics.impressions))
    ELSE 0
  END AS avg_position
FROM gsc_metrics
WHERE gsc_metrics.project_id = project_id
AND date BETWEEN start_date AND end_date
AND (filter_text = '' OR gsc_metrics.page_url ILIKE '%' || filter_text || '%')
GROUP BY gsc_metrics.page_url
ORDER BY SUM(gsc_metrics.clicks) DESC, SUM(gsc_metrics.impressions) DESC;
$$;