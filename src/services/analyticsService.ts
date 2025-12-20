import { supabase } from '@/lib/supabaseClient';

interface DateRange {
  start: string;
  end: string;
}

interface AnalyticsSummary {
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
  avg_position: number;
}

interface TopPage {
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
}

interface OtherPagesAggregate {
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
}

const defaultSummary: AnalyticsSummary = {
  total_clicks: 0,
  total_impressions: 0,
  avg_ctr: 0,
  avg_position: 0
};

const defaultOtherPages: OtherPagesAggregate = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  avg_position: 0
};

/**
 * Get property-level analytics summary metrics from database
 * These metrics match GSC UI totals more closely
 */
export const getPropertyAnalyticsSummary = async (
  projectId: string,
  dateRange: DateRange
): Promise<AnalyticsSummary> => {
  console.log('Calling get property analytics summary with:', { projectId, dateRange });
  
  const { data, error } = await supabase
    .from('gsc_property_metrics')
    .select('clicks, impressions, ctr, avg_position')
    .eq('project_id', projectId)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end);

  console.log('RAW PROPERTY SUMMARY response:', { data, error });
  
  if (error) {
    console.error('Error fetching property analytics summary:', error);
    throw error;
  }

  // Aggregate the property-level data
  if (!data || data.length === 0) {
    return defaultSummary;
  }

  const total_clicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const total_impressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const avg_ctr = total_impressions > 0 ? total_clicks / total_impressions : 0;
  
  // For position, we'll calculate a simple average of the avg_position values
  const positions = data.map(row => row.avg_position || 0).filter(pos => pos > 0);
  const avg_position = positions.length > 0 
    ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length 
    : 0;

  return {
    total_clicks,
    total_impressions,
    avg_ctr,
    avg_position
  };
};

/**
 * Get analytics summary metrics from database (page-level aggregation)
 */
export const getAnalyticsSummary = async (
  projectId: string,
  dateRange: DateRange
): Promise<AnalyticsSummary> => {
  console.log('Calling get_analytics_summary with:', { projectId, dateRange });
  
  const { data, error } = await supabase
    .rpc('get_analytics_summary', {
      project_id: projectId,
      start_date: dateRange.start,
      end_date: dateRange.end
    });

  console.log('RAW SUMMARY RPC response:', { data, error });
  
  if (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }

  // Supabase RPC returns array of rows, even for single row functions
  const row = data?.[0];
  console.log('First row from summary:', row);
  
  return {
    total_clicks: row?.total_clicks ?? 0,
    total_impressions: row?.total_impressions ?? 0,
    avg_ctr: row?.avg_ctr ?? 0,
    avg_position: row?.avg_position ?? 0
  };
};

/**
 * Get top 10 performing pages from database
 */
export const getTopPages = async (
  projectId: string,
  dateRange: DateRange
): Promise<TopPage[]> => {
  console.log('Calling get_top_pages with:', { projectId, dateRange });
  
  const { data, error } = await supabase
    .rpc('get_top_pages', {
      project_id: projectId,
      start_date: dateRange.start,
      end_date: dateRange.end
    });

  console.log('RAW TOP PAGES RPC response:', { data, error });
  
  if (error) {
    console.error('Error fetching top pages:', error);
    throw error;
  }

  // Return the array directly, or empty array if null
  return data || [];
};

/**
 * Get aggregated "other pages" metrics from database
 */
export const getOtherPagesAggregate = async (
  projectId: string,
  dateRange: DateRange
): Promise<OtherPagesAggregate> => {
  console.log('Calling get_other_pages_aggregate with:', { projectId, dateRange });
  
  const { data, error } = await supabase
    .rpc('get_other_pages_aggregate', {
      project_id: projectId,
      start_date: dateRange.start,
      end_date: dateRange.end
    });

  console.log('RAW OTHER PAGES RPC response:', { data, error });
  
  if (error) {
    console.error('Error fetching other pages aggregate:', error);
    throw error;
  }

  // Supabase RPC returns array of rows, even for single row functions
  const row = data?.[0];
  console.log('First row from other pages:', row);
  
  return {
    clicks: row?.clicks ?? 0,
    impressions: row?.impressions ?? 0,
    ctr: row?.ctr ?? 0,
    avg_position: row?.avg_position ?? 0
  };
};

/**
 * Get all pages for detailed view (with pagination)
 */
export const getAllPages = async (
  projectId: string,
  dateRange: DateRange,
  page: number = 1,
  pageSize: number = 25,
  sortBy: string = 'clicks',
  sortOrder: 'asc' | 'desc' = 'desc',
  filterText: string = ''
): Promise<{ data: TopPage[]; totalCount: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .rpc('get_all_pages', {
      project_id: projectId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      filter_text: filterText || ''
    });

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const { data, error, count } = await query
    .range(from, to);

  if (error) {
    console.error('Error fetching all pages:', error);
    throw error;
  }

  return {
    data: data || [],
    totalCount: count || 0
  };
};