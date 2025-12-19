import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/lib/supabaseClient';
import { useProject } from '@/contexts/ProjectContext';

interface GSCMetric {
  id: string;
  project_id: string;
  page_url: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  date: string;
}

export function SearchConsoleAnalytics({ onRefresh }: { onRefresh?: () => void }) {
  const { selectedProject } = useProject();
  const [metrics, setMetrics] = useState<GSCMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '28d' | '3m' | '6m' | '1y' | 'all'>('28d');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof GSCMetric; direction: 'asc' | 'desc' }>({ 
    key: 'clicks', 
    direction: 'desc' 
  });
  
  // Filtering state
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    if (selectedProject) {
      fetchGSCMetrics();
    }
  }, [selectedProject, dateRange]);

  const getDateRangeFilter = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '28d':
        startDate.setDate(startDate.getDate() - 28);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        // For 'all', we won't apply a start date filter
        return null;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchGSCMetrics = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      // Apply date range filter if not 'all'
      let query = supabase
        .from('gsc_metrics')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('date', { ascending: false });
      
      const dateFilter = getDateRangeFilter();
      if (dateFilter) {
        query = query.gte('date', dateFilter.start).lte('date', dateFilter.end);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Set raw data directly
      setMetrics(data || []);
    } catch (err) {
      setError('Failed to fetch Search Console metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals from raw data
  const aggregatedMetrics = useMemo(() => {
    const pageMetrics: Record<string, any> = {};
    
    metrics.forEach(metric => {
      const pageUrl = metric.page_url || 'unknown';
      
      if (!pageMetrics[pageUrl]) {
        pageMetrics[pageUrl] = {
          id: pageUrl,
          project_id: metric.project_id,
          page_url: metric.page_url,
          clicks: 0,
          impressions: 0,
          totalPositionWeighted: 0, // Sum of (position * impressions)
          date: metric.date
        };
      }
      
      // Accumulate metrics
      pageMetrics[pageUrl].clicks += metric.clicks;
      pageMetrics[pageUrl].impressions += metric.impressions;
      pageMetrics[pageUrl].totalPositionWeighted += metric.avg_position * metric.impressions;
    });
    
    // Convert to array and calculate final metrics
    const result = Object.values(pageMetrics).map(metric => ({
      ...metric,
      // Calculate CTR
      ctr: metric.impressions > 0 ? metric.clicks / metric.impressions : 0,
      // Calculate weighted average position
      avg_position: metric.impressions > 0 ? metric.totalPositionWeighted / metric.impressions : 0
    }));
    
    return result;
  }, [metrics]);
  
  const totalClicks = useMemo(() => aggregatedMetrics.reduce((sum, metric) => sum + metric.clicks, 0), [aggregatedMetrics]);
  const totalImpressions = useMemo(() => aggregatedMetrics.reduce((sum, metric) => sum + metric.impressions, 0), [aggregatedMetrics]);
  const avgCTR = useMemo(() => totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0, [totalClicks, totalImpressions]);
  // Calculate weighted average position
  const avgPosition = useMemo(() => totalImpressions > 0 
    ? aggregatedMetrics.reduce((sum, metric) => sum + (metric.avg_position * metric.impressions), 0) / totalImpressions
    : 0, [aggregatedMetrics, totalImpressions]);
  
  // Handle sorting
  const handleSort = (key: keyof GSCMetric) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply sorting and filtering
  const filteredAndSortedMetrics = useMemo(() => {
    // First filter by text
    let filtered = aggregatedMetrics.filter(metric => 
      !filterText || 
      (metric.page_url && metric.page_url.toLowerCase().includes(filterText.toLowerCase()))
    );
    
    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sorted;
  }, [aggregatedMetrics, filterText, sortConfig]);
  
  // Pagination
  const totalPages = useMemo(() => Math.ceil(filteredAndSortedMetrics.length / itemsPerPage), [filteredAndSortedMetrics.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const paginatedMetrics = useMemo(() => filteredAndSortedMetrics.slice(startIndex, startIndex + itemsPerPage), [filteredAndSortedMetrics, startIndex, itemsPerPage]);
  
  // Get top 10 performing pages (based on clicks and impressions)
  const topPerformingPages = useMemo(() => {
    const topPages = [...aggregatedMetrics]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);
    
    return topPages;
  }, [aggregatedMetrics]);
  
  // Get all other pages except the top 10
  const allOtherPages = useMemo(() => {
    // Get page URLs of top performing pages
    const topPageUrls = new Set(topPerformingPages.map(page => page.page_url));
    
    // Filter out top performing pages from all pages
    const otherPages = filteredAndSortedMetrics.filter(page => {
      // Check if this page is in the top pages
      const isTopPage = topPageUrls.has(page.page_url);
      return !isTopPage;
    });
    
    return otherPages;
  }, [filteredAndSortedMetrics, topPerformingPages]);


  
  // Render loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Console Analytics</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Console Analytics</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Console Analytics</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Connect your Google Search Console account and fetch data to see analytics here.
          </p>
          <Button 
            onClick={onRefresh || (() => window.location.reload())}
            variant="outline"
          >
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Search Console Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            7 days
          </Button>
          <Button 
            variant={dateRange === '28d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('28d')}
          >
            28 days
          </Button>
          <Button 
            variant={dateRange === '3m' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('3m')}
          >
            3 months
          </Button>
          <Button 
            variant={dateRange === '6m' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('6m')}
          >
            6 months
          </Button>
          <Button 
            variant={dateRange === '1y' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('1y')}
          >
            1 year
          </Button>
          <Button 
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('all')}
          >
            All time
          </Button>
        </div>
      </div>
      
      {/* Filter and Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by page URL..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Items per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPosition.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Performing Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Performing Pages</CardTitle>
          <CardDescription>Based on clicks and impressions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Page URL</th>
                  <th className="text-left py-2 font-medium">Clicks</th>
                  <th className="text-left py-2 font-medium">Impressions</th>
                  <th className="text-left py-2 font-medium">CTR</th>
                  <th className="text-left py-2 font-medium">Avg. Position</th>
                </tr>
              </thead>
              <tbody>
                {topPerformingPages.map((metric) => (
                  <tr key={metric.page_url || metric.id} className="border-b">
                    <td className="py-2 font-medium max-w-xs truncate">
                      {metric.page_url || 'N/A'}
                    </td>
                    <td className="py-2">{metric.clicks.toLocaleString()}</td>
                    <td className="py-2">{metric.impressions.toLocaleString()}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {(metric.ctr * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2">{metric.avg_position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* All Other Pages - only show if we have other pages to show */}
      {allOtherPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Other Pages</CardTitle>
            <CardDescription>Excluding top 10 performing pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort('page_url')}>
                      Page URL {sortConfig.key === 'page_url' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-2 font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort('clicks')}>
                      Clicks {sortConfig.key === 'clicks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-2 font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort('impressions')}>
                      Impressions {sortConfig.key === 'impressions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-2 font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort('ctr')}>
                      CTR {sortConfig.key === 'ctr' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-2 font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort('avg_position')}>
                      Avg. Position {sortConfig.key === 'avg_position' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allOtherPages.map((metric) => (
                    <tr key={metric.page_url || metric.id} className="border-b">
                      <td className="py-2 font-medium max-w-xs truncate">
                        {metric.page_url || 'N/A'}
                      </td>
                      <td className="py-2">{metric.clicks.toLocaleString()}</td>
                      <td className="py-2">{metric.impressions.toLocaleString()}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {(metric.ctr * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2">{metric.avg_position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for all other pages */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {allOtherPages.length} of {allOtherPages.length} results
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      

    </div>
  );
}