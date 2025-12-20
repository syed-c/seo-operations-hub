-- Temporary migration to remove date filters for debugging
-- This will help us verify if the dashboard lights up when date filters are removed

-- Function to get analytics summary (without date filter)
CREATE OR REPLACE FUNCTION get_analytics_summary(
  project_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_clicks BIGINT,
  total_impressions BIGINT,
  avg_ctr DOUBLE PRECISION,
  avg_position DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  SELECT
    COALESCE(SUM(clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(impressions), 0)::BIGINT AS total_impressions,
    CASE 
      WHEN COALESCE(SUM(impressions), 0) > 0 
      THEN (SUM(clicks)::DOUBLE PRECISION / SUM(impressions)::DOUBLE PRECISION)
      ELSE 0
    END AS avg_ctr,
    CASE 
      WHEN COALESCE(SUM(impressions), 0) > 0 
      THEN (SUM(avg_position * impressions) / SUM(impressions))
      ELSE 0
    END AS avg_position
  FROM gsc_metrics
  WHERE gsc_metrics.project_id = get_analytics_summary.project_id;
  -- Removed date filter for debugging
$$;

-- Function to get top 10 performing pages (without date filter)
CREATE OR REPLACE FUNCTION get_top_pages(
  project_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  page_url TEXT,
  clicks BIGINT,
  impressions BIGINT,
  ctr DOUBLE PRECISION,
  avg_position DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  SELECT
    gsc_metrics.page_url,
    COALESCE(SUM(gsc_metrics.clicks), 0)::BIGINT AS clicks,
    COALESCE(SUM(gsc_metrics.impressions), 0)::BIGINT AS impressions,
    CASE 
      WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
      THEN (SUM(gsc_metrics.clicks)::DOUBLE PRECISION / SUM(gsc_metrics.impressions)::DOUBLE PRECISION)
      ELSE 0
    END AS ctr,
    CASE 
      WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
      THEN (SUM(gsc_metrics.avg_position * gsc_metrics.impressions) / SUM(gsc_metrics.impressions))
      ELSE 0
    END AS avg_position
  FROM gsc_metrics
  WHERE gsc_metrics.project_id = get_top_pages.project_id
  -- Removed date filter for debugging
  GROUP BY gsc_metrics.page_url
  ORDER BY SUM(gsc_metrics.clicks) DESC, SUM(gsc_metrics.impressions) DESC
  LIMIT 10;
$$;

-- Function to get aggregated "other pages" metrics (without date filter)
CREATE OR REPLACE FUNCTION get_other_pages_aggregate(
  project_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  clicks BIGINT,
  impressions BIGINT,
  ctr DOUBLE PRECISION,
  avg_position DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  WITH top_pages AS (
    SELECT page_url
    FROM gsc_metrics
    WHERE gsc_metrics.project_id = get_other_pages_aggregate.project_id
    -- Removed date filter for debugging
    GROUP BY page_url
    ORDER BY SUM(clicks) DESC, SUM(impressions) DESC
    LIMIT 10
  ),
  filtered_pages AS (
    SELECT *
    FROM gsc_metrics
    WHERE gsc_metrics.project_id = get_other_pages_aggregate.project_id
    -- Removed date filter for debugging
    AND gsc_metrics.page_url NOT IN (SELECT COALESCE(page_url, '') FROM top_pages WHERE page_url IS NOT NULL)
  )
  SELECT
    COALESCE(SUM(clicks), 0)::BIGINT AS clicks,
    COALESCE(SUM(impressions), 0)::BIGINT AS impressions,
    CASE 
      WHEN COALESCE(SUM(impressions), 0) >= 50  -- Minimum threshold for reliable CTR
      THEN (SUM(clicks)::DOUBLE PRECISION / SUM(impressions)::DOUBLE PRECISION)
      ELSE 0  -- Return 0 for unreliable CTR
    END AS ctr,
    CASE 
      WHEN COALESCE(SUM(impressions), 0) > 0 
      THEN (SUM(avg_position * impressions) / SUM(impressions))
      ELSE 0
    END AS avg_position
  FROM filtered_pages;
$$;

-- Function to get all pages (for detailed view with pagination) (without date filter)
CREATE OR REPLACE FUNCTION get_all_pages(
  project_id UUID,
  start_date DATE,
  end_date DATE,
  filter_text TEXT DEFAULT ''
)
RETURNS TABLE (
  page_url TEXT,
  clicks BIGINT,
  impressions BIGINT,
  ctr DOUBLE PRECISION,
  avg_position DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  SELECT
    gsc_metrics.page_url,
    COALESCE(SUM(gsc_metrics.clicks), 0)::BIGINT AS clicks,
    COALESCE(SUM(gsc_metrics.impressions), 0)::BIGINT AS impressions,
    CASE 
      WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
      THEN (SUM(gsc_metrics.clicks)::DOUBLE PRECISION / SUM(gsc_metrics.impressions)::DOUBLE PRECISION)
      ELSE 0
    END AS ctr,
    CASE 
      WHEN COALESCE(SUM(gsc_metrics.impressions), 0) > 0 
      THEN (SUM(gsc_metrics.avg_position * gsc_metrics.impressions) / SUM(gsc_metrics.impressions))
      ELSE 0
    END AS avg_position
  FROM gsc_metrics
  WHERE gsc_metrics.project_id = get_all_pages.project_id
  -- Removed date filter for debugging
  AND (filter_text = '' OR gsc_metrics.page_url ILIKE '%' || filter_text || '%')
  GROUP BY gsc_metrics.page_url
  ORDER BY SUM(gsc_metrics.clicks) DESC, SUM(gsc_metrics.impressions) DESC;
$$;