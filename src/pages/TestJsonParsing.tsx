import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Link, 
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface SampleReport {
  id: string;
  status: string;
  taskId: string;
  dead_list: Array<{
    url: string;
    title: string;
    reason: string;
    status: number | null;
    confidence: number;
    content_length: number;
  }>;
  projectId: string;
  assigneeId: string;
  projectName: string;
  submittedAt: string;
  assigneeName: string;
  created_links: {
    dead: number;
    total: number;
    warning: number;
    working: number;
    dead_list: Array<any>;
    warning_list: Array<{
      url: string;
      title: string;
      reason: string;
      status: number | null;
      confidence: number;
      content_length: number;
    }>;
  };
  indexed_blogs: null;
  overall_summary: {
    total_dead: number;
    total_warning: number;
    total_working: number;
    health_percentage: number;
    total_links_checked: number;
  };
  submission_type: string;
}

const sampleData: SampleReport[] = [
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

interface ProcessedLink {
  url: string;
  title: string;
  reason: string;
  status: number | null;
  confidence: number;
  content_length: number;
  category: LinkCategory;
}

export function TestJsonParsing() {
  const [activeTab, setActiveTab] = useState('all');

  // Process the sample data
  const processedLinks: ProcessedLink[] = sampleData.flatMap(report => {
    const links: ProcessedLink[] = [];
    
    // Process created_links.warning_list
    if (report.created_links.warning_list) {
      report.created_links.warning_list.forEach(link => {
        links.push({
          ...link,
          category: 'warning'
        });
      });
    }
    
    // Process dead_list
    report.dead_list.forEach(link => {
      links.push({
        ...link,
        category: 'dead'
      });
    });
    
    // Process working links (these would be in created_links.working if they existed)
    // For now, we'll assume working links are those not in warning or dead lists
    const workingCount = report.created_links.working || 0;
    for (let i = 0; i < workingCount; i++) {
      links.push({
        url: `https://example.com/working-link-${i}`,
        title: `Working Link ${i}`,
        reason: 'Working link',
        status: 200,
        confidence: 95,
        content_length: 1000,
        category: 'working'
      });
    }
    
    return links;
  });

  const linksByCategory = {
    all: processedLinks,
    working: processedLinks.filter(link => link.category === 'working'),
    dead: processedLinks.filter(link => link.category === 'dead'),
    warning: processedLinks.filter(link => link.category === 'warning')
  };

  const getCategoryIcon = (category: LinkCategory) => {
    switch (category) {
      case 'working': return CheckCircle;
      case 'dead': return AlertCircle;
      case 'warning': return AlertTriangle;
      default: return Link;
    }
  };

  const getCategoryColor = (category: LinkCategory) => {
    switch (category) {
      case 'working': return 'text-green-600';
      case 'dead': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryBgColor = (category: LinkCategory) => {
    switch (category) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'dead': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Test JSON Parsing</h1>
        <p className="text-muted-foreground mt-2">
          Testing the JSON parsing with your sample data
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(sampleData.reduce((sum, report) => sum + report.overall_summary.health_percentage, 0) / sampleData.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Health</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sampleData.reduce((sum, report) => sum + report.overall_summary.total_links_checked, 0)}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {sampleData.reduce((sum, report) => sum + report.overall_summary.total_working, 0)}
                </p>
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
                <p className="text-2xl font-bold text-red-600">
                  {sampleData.reduce((sum, report) => sum + report.overall_summary.total_dead, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Dead Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Links ({linksByCategory.all.length})</TabsTrigger>
          <TabsTrigger value="working">Working ({linksByCategory.working.length})</TabsTrigger>
          <TabsTrigger value="dead">Dead ({linksByCategory.dead.length})</TabsTrigger>
          <TabsTrigger value="warning">Warning ({linksByCategory.warning.length})</TabsTrigger>
        </TabsList>
        
        {Object.entries(linksByCategory).map(([category, links]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} Links</CardTitle>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No {category} links found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {links.map((link, index) => {
                      const Icon = getCategoryIcon(link.category);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium truncate"
                              >
                                {link.url}
                              </a>
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                            {link.title && (
                              <p className="text-sm text-muted-foreground truncate">{link.title}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">{link.reason}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{link.status || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">
                                {(link.confidence || 0)}% confidence
                              </p>
                            </div>
                            <Badge className={getCategoryBgColor(link.category)}>
                              <Icon className={`w-3 h-3 mr-1 ${getCategoryColor(link.category)}`} />
                              {link.category}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Raw JSON Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Raw Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}