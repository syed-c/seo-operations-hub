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
import { useBacklinkReportsByTask } from '@/hooks/useBacklinkReports';
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
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BacklinkReportDetailModal({ taskId, isOpen, onClose }: BacklinkReportDetailModalProps) {
  const { data: reports, isLoading, error } = useBacklinkReportsByTask(taskId || '');
  const [isRawJsonOpen, setIsRawJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Aggregate stats logic
  const aggregateReport = reports && reports.length > 0 ? reports.reduce((acc, report) => {
    acc.total_links_checked += (report.total_links_checked || 0);
    acc.total_working += (report.total_working || 0);
    acc.total_dead += (report.total_dead || 0);

    // Status aggregation (most severe)
    if (report.status === 'critical') acc.status = 'critical';
    else if (report.status === 'warning' && acc.status !== 'critical') acc.status = 'warning';

    // Links created aggregation
    const created = report.created_links_summary as CreatedLinksSummary | null;
    if (created) {
      acc.created_links.working += (created.working || 0);
      acc.created_links.dead += (created.dead || 0);
      acc.created_links.total += (created.total || 0);
      acc.created_links.dead_list = [...acc.created_links.dead_list, ...(created.dead_list || [])];
    }

    // Indexed blogs aggregation
    const indexed = report.indexed_blogs_summary as IndexedBlogsSummary | null;
    if (indexed) {
      acc.indexed_blogs.total_blogs += (indexed.total_blogs || 0);
      acc.indexed_blogs.working_blogs += (indexed.working_blogs || 0);
      acc.indexed_blogs.warning_blogs += (indexed.warning_blogs || 0);
      acc.indexed_blogs.critical_blogs += (indexed.critical_blogs || 0);
      acc.indexed_blogs.healthy_blogs += (indexed.healthy_blogs || 0);
      acc.indexed_blogs.blog_details = [...acc.indexed_blogs.blog_details, ...(indexed.blog_details || [])];
      acc.indexed_blogs.requires_attention = [...acc.indexed_blogs.requires_attention, ...(indexed.requires_attention || [])];
    }

    // Keep the one with latest submitted_at as the "main" one for metadata
    if (new Date(report.submitted_at) > new Date(acc.submitted_at)) {
      acc.submitted_at = report.submitted_at;
      acc.projects = report.projects;
      acc.users = report.users;
      acc.tasks = report.tasks;
    }

    acc.payloads.push(report.report_payload);

    return acc;
  }, {
    total_links_checked: 0,
    total_working: 0,
    total_dead: 0,
    status: 'healthy' as BacklinkReportStatus,
    submitted_at: reports[0]?.submitted_at || new Date().toISOString(),
    created_links: { working: 0, dead: 0, total: 0, dead_list: [] as any[] },
    indexed_blogs: { total_blogs: 0, working_blogs: 0, warning_blogs: 0, critical_blogs: 0, healthy_blogs: 0, blog_details: [] as any[], requires_attention: [] as any[] },
    projects: reports[0]?.projects,
    users: reports[0]?.users,
    tasks: reports[0]?.tasks,
    payloads: [] as any[]
  }) : null;

  if (aggregateReport) {
    aggregateReport.health_percentage = aggregateReport.total_links_checked > 0
      ? Math.round((aggregateReport.total_working / aggregateReport.total_links_checked) * 100)
      : 0;
  }

  const handleCopyJson = () => {
    if (aggregateReport?.payloads) {
      navigator.clipboard.writeText(JSON.stringify(aggregateReport.payloads, null, 2));
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const report = aggregateReport; // Alias for cleaner template
  const status = report?.status ? statusConfig[report.status] : null;
  const StatusIcon = status?.icon || AlertCircle;
  const createdLinks = report?.created_links;
  const indexedBlogs = report?.indexed_blogs;

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
                  <TabsTrigger value="report_doc" className="flex-1">Report Document</TabsTrigger>
                  <TabsTrigger value="created_links" className="flex-1">Created Links</TabsTrigger>
                  <TabsTrigger value="indexed_blogs" className="flex-1">Indexed Blogs</TabsTrigger>
                  <TabsTrigger value="issues" className="flex-1">Issues</TabsTrigger>
                </TabsList>

                {/* Report Document Tab (Summary View) */}
                <TabsContent value="report_doc" className="mt-4 space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-6 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold m-0">Review Analysis Document</h2>
                      <Badge className={cn('px-3 py-1', status?.bgColor, status?.color)}>
                        {status?.label.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Task Details</h3>
                        <p className="m-0 text-foreground font-medium">{report.tasks?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{report.projects?.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Submission Result</h3>
                        <p className="m-0 text-foreground font-medium">
                          {report.total_working} / {report.total_links_checked} Links Working
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Health Score: {report.health_percentage}%</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-bold mb-3 pb-2 border-b">Executive Summary</h3>
                        <p className="text-sm leading-relaxed">
                          This report summarizes the verification results for the <strong>{report.tasks?.title}</strong> task.
                          A total of <strong>{report.total_links_checked}</strong> URLs were checked across
                          <strong>{report.payloads?.length || 1}</strong> submission batches.
                          The overall health is <strong>{report.status}</strong> with a success rate of <strong>{report.health_percentage}%</strong>.
                        </p>
                      </section>

                      {report.total_dead > 0 && (
                        <section className="bg-destructive/5 p-4 rounded-xl border border-destructive/20">
                          <h3 className="text-lg font-bold mb-2 text-destructive flex items-center gap-2 m-0">
                            <AlertCircle className="w-5 h-5" />
                            Security / Health Alerts
                          </h3>
                          <p className="text-sm mt-2 m-0">
                            Detected <strong>{report.total_dead}</strong> dead links that require immediate attention.
                            {report.indexed_blogs.critical_blogs > 0 && ` There are ${report.indexed_blogs.critical_blogs} blogs in critical state due to multiple dead interlinks.`}
                          </p>
                        </section>
                      )}

                      <section>
                        <h3 className="text-lg font-bold mb-3 pb-2 border-b">Detailed Methodology</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Verified all newly created target URLs for availability.</li>
                          <li>Crawled indexed blog posts to verify internal linking health.</li>
                          <li>Identified cross-domain redirect issues and 404 response codes.</li>
                        </ul>
                      </section>
                    </div>
                  </div>
                </TabsContent>

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
                <TabsContent value="indexed_blogs" className="mt-4 space-y-4">
                  {!indexedBlogs || indexedBlogs.total_blogs === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground">No indexed blogs analyzed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-success/10 p-3 rounded-xl border border-success/20 text-center">
                          <p className="text-lg font-bold text-success">{indexedBlogs.healthy_blogs}</p>
                          <p className="text-[10px] uppercase tracking-wider text-success/70">Healthy</p>
                        </div>
                        <div className="bg-warning/10 p-3 rounded-xl border border-warning/20 text-center">
                          <p className="text-lg font-bold text-warning">{indexedBlogs.warning_blogs}</p>
                          <p className="text-[10px] uppercase tracking-wider text-warning/70">Warning</p>
                        </div>
                        <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-center">
                          <p className="text-lg font-bold text-destructive">{indexedBlogs.critical_blogs}</p>
                          <p className="text-[10px] uppercase tracking-wider text-destructive/70">Critical</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {indexedBlogs.blog_details?.map((blog, idx) => {
                          const blogStatus = statusConfig[blog.blog_status as BacklinkReportStatus] || statusConfig.healthy;
                          const BlogIcon = blogStatus.icon;

                          return (
                            <Card key={idx} className="overflow-hidden border-none shadow-sm bg-muted/30">
                              <CardContent className="p-0">
                                <div className={cn("px-4 py-3 flex items-center justify-between border-b bg-card",
                                  blog.blog_status === 'critical' ? 'border-destructive/20' :
                                    blog.blog_status === 'warning' ? 'border-warning/20' : 'border-success/20'
                                )}>
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn("p-2 rounded-lg", blogStatus.bgColor)}>
                                      <BlogIcon className={cn("w-4 h-4", blogStatus.color)} />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-semibold truncate m-0">
                                        {blog.blog_title || 'Untitled Blog Post'}
                                      </h4>
                                      <a
                                        href={blog.blog_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-muted-foreground hover:underline flex items-center gap-1 mt-0.5"
                                      >
                                        {blog.blog_url}
                                        <ExternalLink className="w-2 h-2" />
                                      </a>
                                    </div>
                                  </div>
                                  <Badge className={cn("ml-2 font-mono text-[10px] py-0 px-2", blogStatus.bgColor, blogStatus.color)}>
                                    {blog.blog_status?.toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="p-4 bg-muted/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-muted-foreground">Interlink Health</span>
                                    <div className="flex gap-2">
                                      <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                                        {blog.working_interlinks} WORKING
                                      </span>
                                      {blog.dead_interlinks > 0 && (
                                        <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                          {blog.dead_interlinks} DEAD
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {blog.issues.length > 0 ? (
                                    <div className="space-y-1.5 mt-2">
                                      {blog.issues.map((issue, i) => (
                                        <div key={i} className="flex gap-2 p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                                          <AlertCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                                          <p className="text-[11px] text-destructive leading-tight m-0">{issue}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 bg-success/5 rounded-lg border border-success/10">
                                      <CheckCircle className="w-3 h-3 text-success shrink-0" />
                                      <p className="text-[11px] text-success m-0">All interlinks are healthy</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
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
                      {JSON.stringify(report.payloads, null, 2)}
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
