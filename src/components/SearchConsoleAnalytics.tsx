import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useProject } from '@/contexts/ProjectContext';
import { 
  getAnalyticsSummary,
  getTopPages, 
  getOtherPagesAggregate,
  getAllPages
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
  
  // Sorting states
  const [topPagesSort, setTopPagesSort] = useState<'clicks' | 'impressions'>('clicks');
  
  // Drill-down states
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [allPages, setAllPages] = useState<TopPage[]>([]);
  const [allPagesTotal, setAllPagesTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortBy, setSortBy] = useState('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchData();
    }
  }, [selectedProject, dateRange, topPagesSort]);

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
      
      // Debug logging to verify date formats
      console.log('RPC dates being sent:', { 
        projectId: selectedProject.id, 
        startDate: dateFilter.start, 
        endDate: dateFilter.end 
      });
      
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

  const fetchAllPages = async (page: number = 1) => {
    if (!selectedProject) return;
    
    try {
      setDrillDownLoading(true);
      const dateFilter = getDateRangeFilter();
      
      // Debug logging to verify date formats
      console.log('Drill-down RPC dates being sent:', { 
        projectId: selectedProject.id, 
        startDate: dateFilter.start, 
        endDate: dateFilter.end 
      });
      
      const result = await getAllPages(
        selectedProject.id,
        dateFilter,
        page,
        pageSize,
        sortBy,
        sortOrder,
        filterText
      );
      
      setAllPages(result.data);
      setAllPagesTotal(result.totalCount);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching all pages:', err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const totalPages = Math.ceil(allPagesTotal / pageSize);

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
    <TooltipProvider>
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
        
        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
          <p><strong>Note:</strong> Metrics are based on page-level Search Console API data and may differ from Google Search Console UI totals. Property-level metrics are used for summary cards.</p>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Top 10 Performing Pages</CardTitle>
                <CardDescription>Based on {topPagesSort === 'clicks' ? 'clicks' : 'impressions'}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={topPagesSort === 'clicks' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTopPagesSort('clicks')}
                >
                  Sort by Clicks
                </Button>
                <Button 
                  variant={topPagesSort === 'impressions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTopPagesSort('impressions')}
                >
                  Sort by Impressions
                </Button>
              </div>
            </div>
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
                          {(page.impressions || 0) >= 100 ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              {((page.ctr || 0) * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2">
                          {(page.impressions || 0) >= 50 ? 
                            (page.avg_position || 0).toFixed(1) : 
                            <span className="text-muted-foreground text-xs">—</span>
                          }
                        </td>
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
        {((otherPages.impressions || 0) >= 10) ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Remaining Low-Volume Pages</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aggregated metrics for pages outside the top 10.<br />Low-volume pages may contribute minimal impressions.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Dialog open={isDrillDownOpen} onOpenChange={(open) => {
                  setIsDrillDownOpen(open);
                  if (open) {
                    fetchAllPages(1);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View All Pages</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>All Pages Performance</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {/* Filter */}
                      <div className="mb-4">
                        <Input
                          placeholder="Filter by page URL..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      
                      {/* Table */}
                      <div className="flex-1 overflow-auto">
                        {drillDownLoading ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-background">
                                <tr className="border-b">
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('page_url')}
                                  >
                                    Page URL {sortBy === 'page_url' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('clicks')}
                                  >
                                    Clicks {sortBy === 'clicks' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('impressions')}
                                  >
                                    Impressions {sortBy === 'impressions' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('ctr')}
                                  >
                                    CTR {sortBy === 'ctr' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('avg_position')}
                                  >
                                    Avg. Position {sortBy === 'avg_position' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {allPages.map((page, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="py-2 font-medium max-w-xs truncate">
                                      {page.page_url || 'N/A'}
                                    </td>
                                    <td className="py-2">{(page.clicks || 0).toLocaleString()}</td>
                                    <td className="py-2">{(page.impressions || 0).toLocaleString()}</td>
                                    <td className="py-2">
                                      {(page.impressions || 0) >= 100 ? (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                          {((page.ctr || 0) * 100).toFixed(2)}%
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                      )}
                                    </td>
                                    <td className="py-2">
                                      {(page.impressions || 0) >= 50 ? 
                                        (page.avg_position || 0).toFixed(1) : 
                                        <span className="text-muted-foreground text-xs">—</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {allPages.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                No pages found matching your criteria
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {Math.min((currentPage - 1) * pageSize + 1, allPagesTotal)} to {Math.min(currentPage * pageSize, allPagesTotal)} of {allPagesTotal} pages
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAllPages(currentPage - 1)}
                            disabled={currentPage <= 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAllPages(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>Excludes top 10 performing pages</CardDescription>
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
                      <td className="py-2 font-medium">
                        <div className="flex items-center gap-1">
                          CTR
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs text-muted-foreground cursor-help">ⓘ</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>CTR shown only when impressions ≥ 100<br />for statistical reliability</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="py-2">
                        {(otherPages.impressions || 0) >= 100 ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {((otherPages.ctr || 0) * 100).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">
                        <div className="flex items-center gap-1">
                          Avg. Position
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs text-muted-foreground cursor-help">ⓘ</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average position for aggregated pages.<br />Hidden when impressions &lt; 50.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="py-2">
                        {(otherPages.impressions || 0) >= 50 ? 
                          (otherPages.avg_position || 0).toFixed(1) : 
                          <span className="text-muted-foreground text-xs">—</span>
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Remaining Low-Volume Pages</CardTitle>
                  <CardDescription>Excludes top 10 performing pages</CardDescription>
                </div>
                <Dialog open={isDrillDownOpen} onOpenChange={(open) => {
                  setIsDrillDownOpen(open);
                  if (open) {
                    fetchAllPages(1);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View All Pages</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>All Pages Performance</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {/* Filter */}
                      <div className="mb-4">
                        <Input
                          placeholder="Filter by page URL..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      
                      {/* Table */}
                      <div className="flex-1 overflow-auto">
                        {drillDownLoading ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-background">
                                <tr className="border-b">
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('page_url')}
                                  >
                                    Page URL {sortBy === 'page_url' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('clicks')}
                                  >
                                    Clicks {sortBy === 'clicks' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('impressions')}
                                  >
                                    Impressions {sortBy === 'impressions' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('ctr')}
                                  >
                                    CTR {sortBy === 'ctr' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                  <th 
                                    className="text-left py-2 font-medium cursor-pointer hover:bg-muted"
                                    onClick={() => handleSort('avg_position')}
                                  >
                                    Avg. Position {sortBy === 'avg_position' && (sortOrder === 'asc' ? '↑' : '↓')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {allPages.map((page, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="py-2 font-medium max-w-xs truncate">
                                      {page.page_url || 'N/A'}
                                    </td>
                                    <td className="py-2">{(page.clicks || 0).toLocaleString()}</td>
                                    <td className="py-2">{(page.impressions || 0).toLocaleString()}</td>
                                    <td className="py-2">
                                      {(page.impressions || 0) >= 100 ? (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                          {((page.ctr || 0) * 100).toFixed(2)}%
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                      )}
                                    </td>
                                    <td className="py-2">
                                      {(page.impressions || 0) >= 50 ? 
                                        (page.avg_position || 0).toFixed(1) : 
                                        <span className="text-muted-foreground text-xs">—</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {allPages.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                No pages found matching your criteria
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {Math.min((currentPage - 1) * pageSize + 1, allPagesTotal)} to {Math.min(currentPage * pageSize, allPagesTotal)} of {allPagesTotal} pages
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAllPages(currentPage - 1)}
                            disabled={currentPage <= 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAllPages(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                Not enough data for remaining pages in this time range
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}