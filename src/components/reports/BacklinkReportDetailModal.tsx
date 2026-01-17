import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Link,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  User,
  Folder,
} from 'lucide-react';
import { useBacklinkReport } from '@/hooks/useBacklinkReports';
import { BacklinkReportStatus, BacklinkReportPayload, IndexedBlogsSummary, CreatedLinksSummary } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const statusConfig: Record<BacklinkReportStatus, { icon: typeof AlertCircle; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Warning',
  },
  healthy: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Healthy',
  },
};

interface BacklinkReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BacklinkReportDetailModal({ reportId, isOpen, onClose }: BacklinkReportDetailModalProps) {
  const { data: report, isLoading, error } = useBacklinkReport(reportId || '');
  const [isRawJsonOpen, setIsRawJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (report?.report_payload) {
      navigator.clipboard.writeText(JSON.stringify(report.report_payload, null, 2));
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const status = report?.status ? statusConfig[report.status] : null;
  const StatusIcon = status?.icon || AlertCircle;
  const payload = report?.report_payload as BacklinkReportPayload | null;
  const createdLinks = report?.created_links_summary as CreatedLinksSummary | null;
  const indexedBlogs = report?.indexed_blogs_summary as IndexedBlogsSummary | null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            {status && (
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', status.bgColor)}>
                <StatusIcon className={cn('w-5 h-5', status.color)} />
              </div>
            )}
            <div className="flex-1">
              <SheetTitle className="text-left">
                {isLoading ? <Skeleton className="h-6 w-48" /> : report?.tasks?.title || 'Backlink Report'}
              </SheetTitle>
              {!isLoading && status && (
                <Badge className={cn('mt-1', status.bgColor, status.color)}>
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error loading report: {error.message}</span>
              </div>
            </div>
          ) : report ? (
            <div className="p-6 space-y-6">
              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Folder className="w-4 h-4" />
                  <span>{report.projects?.name || 'Unknown Project'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>
                    {report.users?.first_name && report.users?.last_name
                      ? `${report.users.first_name} ${report.users.last_name}`
                      : report.users?.email || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(report.submitted_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Summary Stats - using actual DB columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{report.total_links_checked || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Links</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-success">{report.total_working || 0}</p>
                    <p className="text-xs text-muted-foreground">Working</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={cn('text-2xl font-bold', (report.total_dead || 0) > 0 && 'text-destructive')}>
                      {report.total_dead || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Dead</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={cn('text-2xl font-bold', report.health_percentage < 80 ? 'text-warning' : 'text-success')}>
                      {report.health_percentage || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Health</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for Details */}
              <Tabs defaultValue="created_links" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="created_links" className="flex-1">Created Links</TabsTrigger>
                  <TabsTrigger value="indexed_blogs" className="flex-1">Indexed Blogs</TabsTrigger>
                  <TabsTrigger value="issues" className="flex-1">Issues</TabsTrigger>
                </TabsList>

                {/* Created Links Tab */}
                <TabsContent value="created_links" className="mt-4 space-y-2">
                  {!createdLinks || createdLinks.total === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No created links in this report</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-4 text-sm mb-4">
                        <span className="text-success">✓ Working: {createdLinks.working}</span>
                        <span className="text-destructive">✗ Dead: {createdLinks.dead}</span>
                        <span>Total: {createdLinks.total}</span>
                      </div>
                      {createdLinks.dead_list?.map((link, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-destructive">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Link className="w-4 h-4 flex-shrink-0 text-destructive" />
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm truncate hover:underline"
                              >
                                {link.url}
                              </a>
                            </div>
                            <Badge variant="destructive" className="flex-shrink-0 ml-2">
                              Dead
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Reason: {link.reason}
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Indexed Blogs Tab */}
                <TabsContent value="indexed_blogs" className="mt-4 space-y-2">
                  {!indexedBlogs || indexedBlogs.total_blogs === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No indexed blogs in this report</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-4 text-sm mb-4">
                        <span className="text-success">Healthy: {indexedBlogs.healthy_blogs}</span>
                        <span className="text-warning">Warning: {indexedBlogs.warning_blogs}</span>
                        <span className="text-destructive">Critical: {indexedBlogs.critical_blogs}</span>
                      </div>
                      {indexedBlogs.blog_details?.map((blog, idx) => (
                        <Card key={idx} className={cn('p-3 border-l-4', 
                          blog.blog_status === 'critical' ? 'border-l-destructive' : 
                          blog.blog_status === 'warning' ? 'border-l-warning' : 'border-l-success'
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className={cn('w-4 h-4 flex-shrink-0', 
                                blog.blog_status === 'critical' ? 'text-destructive' :
                                blog.blog_status === 'warning' ? 'text-warning' : 'text-success'
                              )} />
                              <a
                                href={blog.blog_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm truncate hover:underline font-medium"
                              >
                                {blog.blog_title || blog.blog_url}
                              </a>
                            </div>
                            <Badge variant={blog.blog_status === 'critical' ? 'destructive' : blog.blog_status === 'warning' ? 'secondary' : 'default'} className="flex-shrink-0 ml-2">
                              {blog.blog_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6 mb-2">
                            {blog.total_interlinks} interlinks ({blog.working_interlinks} working, {blog.dead_interlinks} dead)
                          </p>
                          {blog.issues.length > 0 && (
                            <div className="ml-6 text-xs text-destructive">
                              {blog.issues.map((issue, i) => (
                                <p key={i}>• {issue}</p>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Issues Tab - using requires_attention from indexed_blogs_summary */}
                <TabsContent value="issues" className="mt-4 space-y-3">
                  {indexedBlogs?.requires_attention && indexedBlogs.requires_attention.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Blogs Requiring Attention ({indexedBlogs.requires_attention.length})
                      </h4>
                      {indexedBlogs.requires_attention.map((url, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-warning">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline flex items-center gap-1"
                          >
                            {url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Card>
                      ))}
                    </div>
                  )}

                  {createdLinks?.dead_list && createdLinks.dead_list.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        Dead Created Links ({createdLinks.dead_list.length})
                      </h4>
                      {createdLinks.dead_list.map((link, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-destructive">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                          >
                            {link.url}
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">
                            {link.reason} (Status: {link.status})
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}

                  {(!indexedBlogs?.requires_attention || indexedBlogs.requires_attention.length === 0) && 
                   (!createdLinks?.dead_list || createdLinks.dead_list.length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-success mb-2" />
                      <p className="text-muted-foreground">No critical issues found!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Raw JSON Payload */}
              <Collapsible open={isRawJsonOpen} onOpenChange={setIsRawJsonOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Raw JSON Payload</span>
                    {isRawJsonOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={handleCopyJson}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                      {JSON.stringify(report.report_payload, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
