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
 * Get analytics summary metrics from database
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
    return defaultSummary;
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
    return [];
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
    return defaultOtherPages;
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
    return { data: [], totalCount: 0 };
  }

  return {
    data: data || [],
    totalCount: count || 0
  };
};