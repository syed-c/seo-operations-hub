import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      
      // Group by page_url and aggregate metrics properly
      const pageMetrics = {};
      
      (data || []).forEach(metric => {
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
      const aggregatedMetrics = Object.values(pageMetrics).map(metric => ({
        ...metric,
        // Calculate CTR
        ctr: metric.impressions > 0 ? metric.clicks / metric.impressions : 0,
        // Calculate weighted average position
        avg_position: metric.impressions > 0 ? metric.totalPositionWeighted / metric.impressions : 0
      })).sort((a, b) => b.impressions - a.impressions);
      
      // Debug logging
      // console.log('Page metrics count:', Object.keys(pageMetrics).length);
      // console.log('Aggregated metrics count:', aggregatedMetrics.length);
      // if (aggregatedMetrics.length > 0) {
      //   console.log('First metric:', aggregatedMetrics[0]);
      // }
      
      setMetrics(aggregatedMetrics);
    } catch (err) {
      setError('Failed to fetch Search Console metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate totals
  const totalClicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const totalImpressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  // Calculate weighted average position
  const avgPosition = totalImpressions > 0 
    ? metrics.reduce((sum, metric) => sum + (metric.avg_position * metric.impressions), 0) / totalImpressions
    : 0;
  
  // Debug logging
  // console.log('Metrics count:', metrics.length);
  // console.log('Total Clicks:', totalClicks);
  // console.log('Total Impressions:', totalImpressions);
  // console.log('Avg CTR:', avgCTR);
  // console.log('Avg Position:', avgPosition);

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

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Pages</CardTitle>
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
                {metrics.slice(0, 10).map((metric) => (
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
    </div>
  );
}