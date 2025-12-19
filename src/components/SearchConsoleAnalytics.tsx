import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useProject } from '@/contexts/ProjectContext';
import { 
  getAnalyticsSummary, 
  getTopPages, 
  getOtherPagesAggregate 
} from '@/services/analyticsService';

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

export function SearchConsoleAnalytics({ onRefresh }: { onRefresh?: () => void }) {
  const { selectedProject } = useProject();
  const [summary, setSummary] = useState<AnalyticsSummary>({
    total_clicks: 0,
    total_impressions: 0,
    avg_ctr: 0,
    avg_position: 0
  });
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [otherPages, setOtherPages] = useState<OtherPagesAggregate>({
    clicks: 0,
    impressions: 0,
    ctr: 0,
    avg_position: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '28d' | '3m' | '6m' | '1y' | 'all'>('28d');

  useEffect(() => {
    if (selectedProject) {
      fetchData();
    }
  }, [selectedProject, dateRange]);

  const getDateRangeFilter = (): DateRange => {
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
        // For 'all', go back 5 years
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const dateFilter = getDateRangeFilter();
      
      // Fetch all data in parallel
      const [summaryData, topPagesData, otherPagesData] = await Promise.all([
        getAnalyticsSummary(selectedProject.id, dateFilter),
        getTopPages(selectedProject.id, dateFilter),
        getOtherPagesAggregate(selectedProject.id, dateFilter)
      ]);
      
      console.log('Fetched data:', { summaryData, topPagesData, otherPagesData });
      
      setSummary(summaryData);
      setTopPages(topPagesData);
      setOtherPages(otherPagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="text-2xl font-bold">{(summary.total_clicks || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary.total_impressions || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((summary.avg_ctr || 0) * 100).toFixed(2)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary.avg_position || 0).toFixed(1)}</div>
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
          {topPages.length > 0 ? (
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
                  {topPages.map((page, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium max-w-xs truncate">
                        {page.page_url || 'N/A'}
                      </td>
                      <td className="py-2">{(page.clicks || 0).toLocaleString()}</td>
                      <td className="py-2">{(page.impressions || 0).toLocaleString()}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {((page.ctr || 0) * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2">{(page.avg_position || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available for top performing pages
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* All Other Pages Aggregate */}
      {((otherPages.clicks || 0) > 0 || (otherPages.impressions || 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>All Other Pages</CardTitle>
            <CardDescription>Aggregated metrics for all pages excluding top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Metric</th>
                    <th className="text-left py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Clicks</td>
                    <td className="py-2">{(otherPages.clicks || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Impressions</td>
                    <td className="py-2">{(otherPages.impressions || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">CTR</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {((otherPages.ctr || 0) * 100).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Avg. Position</td>
                    <td className="py-2">{(otherPages.avg_position || 0).toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}