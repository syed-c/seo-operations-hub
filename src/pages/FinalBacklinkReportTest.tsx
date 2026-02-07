import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample data from your JSON payload
const sampleReportData = [
  {
    "id": "214ece6d-35c6-4f6c-809a-9d8530d53b59",
    "status": "warning",
    "taskId": "000f1968-82e6-4946-9d4d-b24b7b605df3",
    "dead_list": [
      {
        "url": "https://www.zeczec.com/users/dynamic-group",
        "title": "",
        "reason": "Unclassified response",
        "status": null,
        "confidence": 40,
        "content_length": 0
      },
      {
        "url": "https://confengine.com/user/dynamic-group",
        "title": "",
        "reason": "Unclassified response",
        "status": null,
        "confidence": 40,
        "content_length": 0
      },
      {
        "url": "https://solo.to/dynamicgroup",
        "title": "",
        "reason": "Unclassified response",
        "status": null,
        "confidence": 40,
        "content_length": 0
      }
    ],
    "projectId": "02155f85-51d7-4953-9f2d-fa594146487d",
    "assigneeId": "fd5bd07f-d04a-4763-be69-b41da3aaac00",
    "projectName": "MakeMyCompany Oman",
    "submittedAt": "2026-02-07T12:08:21.138Z",
    "assigneeName": "Owais Alvi",
    "created_links": {
      "dead": 0,
      "total": 5,
      "warning": 3,
      "working": 2,
      "dead_list": [],
      "warning_list": [
        {
          "url": "https://www.zeczec.com/users/dynamic-group",
          "title": "",
          "reason": "Unclassified response",
          "status": null,
          "confidence": 40,
          "content_length": 0
        },
        {
          "url": "https://confengine.com/user/dynamic-group",
          "title": "",
          "reason": "Unclassified response",
          "status": null,
          "confidence": 40,
          "content_length": 0
        },
        {
          "url": "https://solo.to/dynamicgroup",
          "title": "",
          "reason": "Unclassified response",
          "status": null,
          "confidence": 40,
          "content_length": 0
        }
      ]
    },
    "indexed_blogs": null,
    "overall_summary": {
      "total_dead": 0,
      "total_warning": 3,
      "total_working": 2,
      "health_percentage": 40,
      "total_links_checked": 5
    },
    "submission_type": "create"
  },
  {
    "id": "66e7098d-f630-4203-bc3a-43a5665e1f20",
    "status": "healthy",
    "taskId": "000f1968-82e6-4946-9d4d-b24b7b605df3",
    "dead_list": [],
    "projectId": "02155f85-51d7-4953-9f2d-fa594146487d",
    "assigneeId": "fd5bd07f-d04a-4763-be69-b41da3aaac00",
    "checked_at": "2026-02-07T12:08:45.129Z",
    "projectName": "MakeMyCompany Oman",
    "submittedAt": "2026-02-07T12:08:10.751Z",
    "assigneeName": "Owais Alvi",
    "created_links": {
      "dead": 0,
      "total": 5,
      "working": 5,
      "dead_list": []
    },
    "indexed_blogs": null,
    "overall_summary": {
      "total_dead": 0,
      "total_working": 5,
      "health_percentage": 100,
      "total_links_checked": 5
    },
    "submission_type": "create"
  }
];

type LinkCategory = 'working' | 'dead' | 'warning';

interface LinkData {
  url: string;
  title: string;
  reason: string;
  status: number | null;
  confidence: number;
  content_length: number;
  category: LinkCategory;
}

const getCategoryFromStatus = (status: number | null, confidence: number): LinkCategory => {
  if (status === 200) return 'working';
  if (status === null && confidence < 50) return 'warning';
  if (status === null) return 'dead';
  if (status && status >= 400) return 'dead';
  return 'warning';
};

const getCategoryColor = (category: LinkCategory) => {
  switch (category) {
    case 'working': return 'text-green-600';
    case 'dead': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    default: return 'text-gray-500';
  }
};

const getCategoryBgColor = (category: LinkCategory) => {
  switch (category) {
    case 'working': return 'bg-green-100';
    case 'dead': return 'bg-red-100';
    case 'warning': return 'bg-yellow-100';
    default: return 'bg-gray-100';
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

export default function FinalBacklinkReportTest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'status' | 'confidence' | 'content_length'>('url');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Process the sample data
  const processedData = sampleReportData.map(report => {
    // Combine all links from created_links and dead_list
    const allLinks: LinkData[] = [];
    
    // Process warning list
    if (report.created_links.warning_list) {
      report.created_links.warning_list.forEach(link => {
        allLinks.push({
          url: link.url,
          title: link.title || link.url,
          reason: link.reason,
          status: link.status,
          confidence: link.confidence,
          content_length: link.content_length,
          category: getCategoryFromStatus(link.status, link.confidence)
        });
      });
    }
    
    // Process dead list
    if (report.dead_list) {
      report.dead_list.forEach(link => {
        allLinks.push({
          url: link.url,
          title: link.title || link.url,
          reason: link.reason,
          status: link.status,
          confidence: link.confidence,
          content_length: link.content_length,
          category: 'dead'
        });
      });
    }
    
    // Add working links (assuming the remaining links are working)
    const workingCount = report.created_links.working || 0;
    for (let i = 0; i < workingCount; i++) {
      allLinks.push({
        url: `https://working-link-${i}.com`,
        title: `Working Link ${i + 1}`,
        reason: 'Working link',
        status: 200,
        confidence: 95,
        content_length: 1000,
        category: 'working'
      });
    }

    return {
      ...report,
      allLinks
    };
  });

  // Flatten all links for display
  const allLinks = processedData.flatMap(report => report.allLinks);
  
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

  // Group links by category
  const linksByCategory = {
    working: sortedLinks.filter(link => link.category === 'working'),
    dead: sortedLinks.filter(link => link.category === 'dead'),
    warning: sortedLinks.filter(link => link.category === 'warning')
  };

  const exportData = () => {
    const dataToExport = {
      summary: {
        total_links: allLinks.length,
        working_links: linksByCategory.working.length,
        dead_links: linksByCategory.dead.length,
        warning_links: linksByCategory.warning.length,
        health_percentage: Math.round((linksByCategory.working.length / allLinks.length) * 100) || 0
      },
      links: sortedLinks.map(link => ({
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
    a.download = `backlink-report-summary.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Final Backlink Report Test</h1>
        <p className="text-muted-foreground mt-2">
          Testing the detailed backlink report functionality with your sample JSON data
        </p>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((linksByCategory.working.length / allLinks.length) * 100) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
            </div>
            <Progress 
              value={Math.round((linksByCategory.working.length / allLinks.length) * 100) || 0} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allLinks.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{linksByCategory.working.length}</p>
                <p className="text-sm text-muted-foreground">Working Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{linksByCategory.dead.length}</p>
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
            <TabsTrigger value="all">All Links ({sortedLinks.length})</TabsTrigger>
            <TabsTrigger value="working">Working ({linksByCategory.working.length})</TabsTrigger>
            <TabsTrigger value="dead">Dead ({linksByCategory.dead.length})</TabsTrigger>
            <TabsTrigger value="warning">Warning ({linksByCategory.warning.length})</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* All Links Tab */}
        <TabsContent value="all" className="mt-0">
          <LinkTable 
            links={sortedLinks}
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
                        <span>{link.confidence}%</span>
                        <Progress value={link.confidence} className="w-16" />
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