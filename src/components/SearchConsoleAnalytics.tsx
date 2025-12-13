import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export function SearchConsoleAnalytics() {
  const { selectedProject } = useProject();
  const [metrics, setMetrics] = useState<GSCMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      fetchGSCMetrics();
    }
  }, [selectedProject]);

  const fetchGSCMetrics = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gsc_metrics')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setMetrics(data || []);
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
          <p className="text-muted-foreground">
            Connect your Google Search Console account and fetch data to see analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalClicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const totalImpressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition = metrics.length > 0 
    ? metrics.reduce((sum, metric) => sum + metric.avg_position, 0) / metrics.length 
    : 0;

  return (
    <div className="space-y-6">
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
                  <tr key={metric.id} className="border-b">
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