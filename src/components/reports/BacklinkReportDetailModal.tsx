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
import { BacklinkReportStatus, BacklinkReportPayload } from '@/types';
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
    if (report?.payload) {
      navigator.clipboard.writeText(JSON.stringify(report.payload, null, 2));
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const status = report?.status ? statusConfig[report.status] : null;
  const StatusIcon = status?.icon || AlertCircle;
  const payload = report?.payload as BacklinkReportPayload | null;

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
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Summary Stats */}
              {payload?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{payload.summary.total_created_links}</p>
                      <p className="text-xs text-muted-foreground">Total Links</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-success">{payload.summary.working_links}</p>
                      <p className="text-xs text-muted-foreground">Working</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className={cn('text-2xl font-bold', payload.summary.dead_links > 0 && 'text-destructive')}>
                        {payload.summary.dead_links}
                      </p>
                      <p className="text-xs text-muted-foreground">Dead</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{payload.summary.total_indexed_blogs}</p>
                      <p className="text-xs text-muted-foreground">Blogs</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs for Details */}
              <Tabs defaultValue="created_links" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="created_links" className="flex-1">Created Links</TabsTrigger>
                  <TabsTrigger value="indexed_blogs" className="flex-1">Indexed Blogs</TabsTrigger>
                  <TabsTrigger value="issues" className="flex-1">Issues</TabsTrigger>
                </TabsList>

                {/* Created Links Tab */}
                <TabsContent value="created_links" className="mt-4 space-y-2">
                  {payload?.created_links?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No created links in this report</p>
                  ) : (
                    payload?.created_links?.map((link, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Link className={cn('w-4 h-4 flex-shrink-0', link.status === 'working' ? 'text-success' : 'text-destructive')} />
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm truncate hover:underline"
                            >
                              {link.url}
                            </a>
                          </div>
                          <Badge variant={link.status === 'working' ? 'default' : 'destructive'} className="flex-shrink-0 ml-2">
                            {link.status}
                          </Badge>
                        </div>
                        {link.anchor_text && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Anchor: "{link.anchor_text}"
                          </p>
                        )}
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Indexed Blogs Tab */}
                <TabsContent value="indexed_blogs" className="mt-4 space-y-2">
                  {payload?.indexed_blogs?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No indexed blogs in this report</p>
                  ) : (
                    payload?.indexed_blogs?.map((blog, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className={cn('w-4 h-4 flex-shrink-0', blog.is_indexed ? 'text-success' : 'text-warning')} />
                            <a
                              href={blog.blog_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm truncate hover:underline"
                            >
                              {blog.blog_url}
                            </a>
                          </div>
                          <Badge variant={blog.is_indexed ? 'default' : 'secondary'} className="flex-shrink-0 ml-2">
                            {blog.is_indexed ? 'Indexed' : 'Not Indexed'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          {blog.interlink_count} interlinks ({blog.interlinks?.filter(i => i.status === 'dead').length || 0} dead)
                        </p>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Issues Tab */}
                <TabsContent value="issues" className="mt-4 space-y-3">
                  {payload?.requires_attention && payload.requires_attention.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Requires Attention
                      </h4>
                      {payload.requires_attention.map((issue, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-warning">
                          <p className="text-sm font-medium">{issue.message}</p>
                          {issue.url && (
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                            >
                              {issue.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            {issue.type.replace(/_/g, ' ')}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  )}

                  {payload?.issues && payload.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        All Issues ({payload.issues.length})
                      </h4>
                      {payload.issues.map((issue, idx) => (
                        <Card key={idx} className={cn('p-3 border-l-4', issue.severity === 'critical' ? 'border-l-destructive' : 'border-l-warning')}>
                          <p className="text-sm">{issue.message}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issue.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {(!payload?.issues || payload.issues.length === 0) && (!payload?.requires_attention || payload.requires_attention.length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-success mb-2" />
                      <p className="text-muted-foreground">No issues found!</p>
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
                      {JSON.stringify(payload, null, 2)}
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
