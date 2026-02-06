import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { FileText, Download, Clock, BarChart3, Trash2, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";
import { useProject } from "@/contexts/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const typeColors: Record<string, string> = {
  daily: "bg-info/10 text-info",
  weekly: "bg-primary/10 text-primary",
  monthly: "bg-secondary/10 text-secondary",
  audit: "bg-warning/10 text-warning",
  Onboarding: "bg-purple-500/10 text-purple-500",
};

interface Report {
  id: string;
  project_id: string;
  report_type: string;
  title: string;
  content: string; // JSONB but contains stringified HTML or JSON
  generated_at: string;
  created_at: string;
  project?: {
    name: string;
  };
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { teamUser } = useAuth();
  const { selectedProject } = useProject();

  // View Report Dialog State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state for creating reports (optional, keeping basic capability)
  const [form, setForm] = useState({ title: "", type: "weekly", projectId: "" });

  const canCreateEditReports = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead' || teamUser?.role === 'Developer';

  // Check if we have any reports for debugging
  useEffect(() => {
    console.log('[Reports.tsx] Reports state:', reports);
    console.log('[Reports.tsx] Selected project:', selectedProject);
  }, [reports, selectedProject]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (roleError) {
        setError(roleError.message);
        setLoading(false);
        return;
      }

      // Build query
      let query = supabase
        .from("reports")
        .select(`
          id, 
          project_id,
          report_type,
          title, 
          content,
          generated_at,
          created_at,
          projects ( name )
        `)
        .order("generated_at", { ascending: false });

      if (selectedProject) {
        query = query.eq('project_id', selectedProject.id);
      }

      if (userData?.role === 'Developer') {
        const { data: projectMemberData, error: projectMemberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);

        if (projectMemberError) {
          setError(projectMemberError.message);
          setLoading(false);
          return;
        }

        if (!projectMemberData || projectMemberData.length === 0) {
          setReports([]);
          setLoading(false);
          return;
        }

        const projectIds = projectMemberData.map(pm => pm.project_id);
        query = query.in('project_id', projectIds);
      }

      console.log('[Reports.tsx] Executing query with selectedProject:', selectedProject?.id);
      const { data, error: queryError } = await query;
      console.log('[Reports.tsx] Query result:', { data, error: queryError });

      setLoading(false);

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const mappedReports = (data || []).map((r: any) => ({
        ...r,
        project: r.projects, // Map joined project data
      }));
      
      console.log('[Reports.tsx] Mapped reports:', mappedReports);
      setReports(mappedReports);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load reports");
      console.error('[Reports.tsx] Error loading reports:', err);
    }
  };

  useEffect(() => {
    load();
  }, [selectedProject]);

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
      setReports(reports.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };



  const parseContent = (content: any) => {
    if (!content) return "";
    // If it's a string, it might be stringified JSON or HTML
    if (typeof content === 'string') {
      // Check if it looks like a stringified string (double quotes at start/end)
      if (content.startsWith('"') && content.endsWith('"')) {
        try {
          // Remove outer quotes and unescape the inner JSON
          const unescaped = content.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
          return JSON.parse(unescaped);
        } catch {
          return content;
        }
      }
      // Try to parse as regular JSON
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
    return content; // Return as-is if it's already an object
  };

  // Function to render structured report content
  const renderReportContent = (content: any) => {
    if (!content) return <p>No content available</p>;
    
    // Parse the content if it's a string
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        parsedContent = parseContent(content);
      } catch (e) {
        return <pre className="text-sm p-4 bg-muted rounded">{content}</pre>;
      }
    }
    
    // If it's not an object, render as JSON
    if (typeof parsedContent !== 'object') {
      return <pre className="text-sm p-4 bg-muted rounded">{JSON.stringify(parsedContent, null, 2)}</pre>;
    }
    
    // Render structured report sections
    return (
      <div className="space-y-6">
        {/* Report Meta */}
        {parsedContent.report_meta && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Report Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Generated:</span> {parsedContent.report_meta.generated_at ? new Date(parsedContent.report_meta.generated_at).toLocaleString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Type:</span> {parsedContent.report_meta.report_type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Version:</span> {parsedContent.report_meta.version || 'N/A'}
              </div>
            </div>
          </div>
        )}
        
        {/* Executive Summary */}
        {parsedContent.executive_summary && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              {parsedContent.executive_summary.title}
            </h2>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: parsedContent.executive_summary.html || parsedContent.executive_summary 
              }} 
            />
          </div>
        )}
        
        {/* Authority & Trust */}
        {parsedContent.authority_and_trust && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              {parsedContent.authority_and_trust.title}
            </h2>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: parsedContent.authority_and_trust.html || parsedContent.authority_and_trust 
              }} 
            />
            {/* Metrics display if available */}
            {parsedContent.authority_and_trust.metrics && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h3 className="font-semibold mb-2">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {parsedContent.authority_and_trust.metrics.domain_authority && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {parsedContent.authority_and_trust.metrics.domain_authority}
                      </div>
                      <div className="text-sm text-muted-foreground">Domain Authority</div>
                    </div>
                  )}
                  {parsedContent.authority_and_trust.metrics.page_authority && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {parsedContent.authority_and_trust.metrics.page_authority}
                      </div>
                      <div className="text-sm text-muted-foreground">Page Authority</div>
                    </div>
                  )}
                  {parsedContent.authority_and_trust.metrics.spam_score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {parsedContent.authority_and_trust.metrics.spam_score}%
                      </div>
                      <div className="text-sm text-muted-foreground">Spam Score</div>
                    </div>
                  )}
                  {parsedContent.authority_and_trust.metrics.backlinks_total && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {parsedContent.authority_and_trust.metrics.backlinks_total.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Backlinks</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* On-Page SEO */}
        {parsedContent.on_page_seo && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              {parsedContent.on_page_seo.title}
            </h2>
            {parsedContent.on_page_seo.critical_issues_html && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-destructive">Critical Issues</h3>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: parsedContent.on_page_seo.critical_issues_html 
                  }} 
                />
              </div>
            )}
            {parsedContent.on_page_seo.technical_issues_html && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-warning">Technical Issues</h3>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: parsedContent.on_page_seo.technical_issues_html 
                  }} 
                />
              </div>
            )}
            {parsedContent.on_page_seo.quick_wins_html && (
              <div>
                <h3 className="text-xl font-semibold mb-3 text-success">Quick Wins</h3>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: parsedContent.on_page_seo.quick_wins_html 
                  }} 
                />
              </div>
            )}
          </div>
        )}
        
        {/* Other sections - render any remaining content */}
        {Object.entries(parsedContent).map(([key, value]) => {
          // Skip sections we already handled
          if (['report_meta', 'executive_summary', 'authority_and_trust', 'on_page_seo'].includes(key)) {
            return null;
          }
          
          if (value && typeof value === 'object' && (value as any).title) {
            const section = value as any;
            return (
              <div key={key} className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">
                  {section.title}
                </h2>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: section.html || section.content || JSON.stringify(section, null, 2)
                  }} 
                />
              </div>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <Header title="Reports" subtitle="View automated SEO reports and insights" />

      {loading && <p className="text-sm text-muted-foreground mb-3">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Reports Generated</p>
            </div>
          </div>
        </div>
        {/* Additional summary cards can be added here based on available aggregations */}
      </div>

      <div className="space-y-4">
        {reports.length === 0 && !loading && !error && (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground">
              Generated reports will appear here.
            </p>
          </div>
        )}

        {reports.map((report, index) => (
          <div
            key={report.id}
            className="glass-card p-6 animate-slide-up hover:shadow-card-hover transition-all"
            style={{ animationDelay: `${(index + 4) * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    {report.report_type && (
                      <span className={cn("chip text-xs capitalize", typeColors[report.report_type] ?? "chip")}>
                        {report.report_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {report.project?.name || "Unknown Project"} • {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : "Recent"}
                  </p>

                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setSelectedReport(report);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View Report
                </Button>

                {canCreateEditReports && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => onDelete(report.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.project?.name} • {selectedReport?.generated_at ? new Date(selectedReport.generated_at).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 prose prose-sm max-w-none dark:prose-invert">
            {renderReportContent(selectedReport?.content)}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
