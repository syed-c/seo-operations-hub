import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Download,
  Link,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Folder,
  ExternalLink,
  BarChart3,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { BacklinkReportPayload } from '@/types';
import { cn } from '@/lib/utils';
import { useBacklinkReportsByTask } from '@/hooks/useBacklinkReports';

type LinkCategory = 'working' | 'dead' | 'warning';

interface LinkData {
  url: string;
  title: string;
  reason: string;
  status: number;
  confidence: number;
  content_length: number;
  category: LinkCategory;
}

const getCategoryFromStatus = (status: number, confidence: number): LinkCategory => {
  if (status === 200) return 'working';
  if (status >= 400 || status === 0) return 'dead';
  if (confidence < 0.8) return 'warning';
  return 'warning';
};

const getCategoryColor = (category: LinkCategory) => {
  switch (category) {
    case 'working': return 'text-green-600';
    case 'dead': return 'text-destructive';
    case 'warning': return 'text-yellow-600';
    default: return 'text-muted-foreground';
  }
};

const getCategoryBgColor = (category: LinkCategory) => {
  switch (category) {
    case 'working': return 'bg-green-100';
    case 'dead': return 'bg-destructive/10';
    case 'warning': return 'bg-yellow-100';
    default: return 'bg-muted/10';
  }
};

const getCategoryIcon = (category: LinkCategory) => {
  switch (category) {
    case 'working': return CheckCircle;
    case 'dead': return AlertCircle;
    case 'warning': return AlertTriangle;
    default: return Link;
  }
};

export function DetailedBacklinkReportPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'status' | 'confidence' | 'content_length'>('url');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: reports, isLoading, error } = useBacklinkReportsByTask(taskId || '');

  // Process the report data
  const processedData = useMemo(() => {
    if (!reports || reports.length === 0) return null;

    // Get the latest report
    const latestReport = reports[0];
    const payload = latestReport.report_payload as BacklinkReportPayload;
    
    if (!payload) return null;

    // Process created links from dead_list and working links
    const createdLinksData: LinkData[] = [];
    
    // Add dead links from dead_list
    if (payload.dead_list && Array.isArray(payload.dead_list)) {
      payload.dead_list.forEach(link => {
        createdLinksData.push({
          url: link.url,
          title: link.title || link.url,
          reason: link.reason || 'No response',
          status: link.status || 0,
          confidence: link.confidence || 0,
          content_length: link.content_length || 0,
          category: 'dead'
        });
      });
    }

    // Process created_links summary data
    if (payload.created_links) {
      // Add working links from created_links
      const workingCount = payload.created_links.working || 0;
      // We'll need to get these from the actual links data if available
      // For now, we'll focus on what we have from dead_list and warning_list
    }

    // Process warning links from created_links.warning_list
    if (payload.created_links?.warning_list && Array.isArray(payload.created_links.warning_list)) {
      payload.created_links.warning_list.forEach(link => {
        createdLinksData.push({
          url: link.url,
          title: link.title || link.url,
          reason: link.reason || 'Warning',
          status: link.status || 0,
          confidence: link.confidence || 0,
          content_length: link.content_length || 0,
          category: 'warning'
        });
      });
    }

    // Process indexed blog interlinks
    const interlinksData: LinkData[] = [];
    if (payload.indexed_blogs?.blog_details) {
      payload.indexed_blogs.blog_details.forEach(blog => {
        blog.interlinks.forEach(interlink => {
          interlinksData.push({
            url: interlink.url,
            title: interlink.title,
            reason: interlink.issue || (interlink.status === 'working' ? 'Working' : 'Dead link'),
            status: interlink.status === 'working' ? 200 : 404,
            confidence: interlink.relevance_score,
            content_length: 0,
            category: interlink.status === 'working' ? 'working' : 'dead'
          });
        });
      });
    }

    // Combine all links
    const allLinks = [...createdLinksData, ...interlinksData];

    // Apply search filter
    const filteredLinks = allLinks.filter(link => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        link.url.toLowerCase().includes(searchLower) ||
        link.title.toLowerCase().includes(searchLower) ||
        link.reason.toLowerCase().includes(searchLower)
      );
    });

    // Apply sorting
    const sortedLinks = [...filteredLinks].sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return {
      report: latestReport,
      payload,
      summary: payload.overall_summary,
      allLinks: sortedLinks,
      createdLinks: sortedLinks.filter(link => link.url.startsWith('http')),
      interlinks: sortedLinks.filter(link => !link.url.startsWith('http'))
    };
  }, [reports, searchTerm, sortBy, sortOrder]);

  const exportData = () => {
    if (!processedData) return;
    
    const dataToExport = {
      report_info: {
        task_id: processedData.report.task_id,
        project_name: processedData.payload.projectName,
        assignee: processedData.payload.assigneeName,
        submitted_at: processedData.report.submitted_at,
        health_percentage: processedData.summary.health_percentage
      },
      summary: processedData.summary,
      links: processedData.allLinks.map(link => ({
        url: link.url,
        title: link.title,
        status: link.status,
        confidence: link.confidence,
        reason: link.reason,
        content_length: link.content_length,
        category: link.category
      }))
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backlink-report-${taskId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error.message}</p>
            <div className="flex justify-end mt-4 gap-2">
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No backlink report data found for this task.</p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, payload, summary, allLinks, createdLinks, interlinks } = processedData;

  // Group links by category
  const linksByCategory = {
    working: allLinks.filter(link => link.category === 'working'),
    dead: allLinks.filter(link => link.category === 'dead'),
    warning: allLinks.filter(link => link.category === 'warning')
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Backlink Report Details</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                {payload.projectName}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {payload.assigneeName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(report.submitted_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.health_percentage}%</p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
            </div>
            <Progress value={summary.health_percentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.total_links_checked}</p>
                <p className="text-sm text-muted-foreground">Total Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.total_working}</p>
                <p className="text-sm text-muted-foreground">Working Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{summary.total_dead}</p>
                <p className="text-sm text-muted-foreground">Dead Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Links ({allLinks.length})</TabsTrigger>
            <TabsTrigger value="working">Working ({linksByCategory.working.length})</TabsTrigger>
            <TabsTrigger value="dead">Dead ({linksByCategory.dead.length})</TabsTrigger>
            <TabsTrigger value="warning">Warning ({linksByCategory.warning.length})</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* All Links Tab */}
        <TabsContent value="all" className="mt-0">
          <LinkTable 
            links={allLinks}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSortBy) => {
              if (newSortBy === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSortBy);
                setSortOrder('asc');
              }
            }}
          />
        </TabsContent>

        {/* Working Links Tab */}
        <TabsContent value="working" className="mt-0">
          <LinkTable 
            links={linksByCategory.working}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSortBy) => {
              if (newSortBy === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSortBy);
                setSortOrder('asc');
              }
            }}
          />
        </TabsContent>

        {/* Dead Links Tab */}
        <TabsContent value="dead" className="mt-0">
          <LinkTable 
            links={linksByCategory.dead}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSortBy) => {
              if (newSortBy === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSortBy);
                setSortOrder('asc');
              }
            }}
          />
        </TabsContent>

        {/* Warning Links Tab */}
        <TabsContent value="warning" className="mt-0">
          <LinkTable 
            links={linksByCategory.warning}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSortBy) => {
              if (newSortBy === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSortBy);
                setSortOrder('asc');
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LinkTableProps {
  links: LinkData[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'url' | 'status' | 'confidence' | 'content_length') => void;
}

function LinkTable({ links, sortBy, sortOrder, onSortChange }: LinkTableProps) {
  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Link className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Links Found</h3>
          <p className="text-muted-foreground">
            No links match your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  const SortableHeader = ({ 
    field, 
    label 
  }: { 
    field: 'url' | 'status' | 'confidence' | 'content_length'; 
    label: string 
  }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
      onClick={() => onSortChange(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          <span className="text-xs">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <SortableHeader field="url" label="URL" />
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <SortableHeader field="status" label="Status" />
                <SortableHeader field="confidence" label="Confidence" />
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <SortableHeader field="content_length" label="Content Length" />
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((link, index) => {
                const CategoryIcon = getCategoryIcon(link.category);
                return (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-mono max-w-xs truncate">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {link.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" title={link.title}>
                      {link.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{link.status || 'N/A'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{(link.confidence * 100).toFixed(1)}%</span>
                        <Progress value={link.confidence * 100} className="w-16" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" title={link.reason}>
                      {link.reason}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {link.content_length > 0 ? `${link.content_length} bytes` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className={cn('w-4 h-4', getCategoryColor(link.category))} />
                        <Badge className={cn('text-xs', getCategoryBgColor(link.category), getCategoryColor(link.category))}>
                          {link.category}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}