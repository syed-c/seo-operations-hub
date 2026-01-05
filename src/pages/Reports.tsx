import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { FileText, Download, Clock, BarChart3, Sparkles, Trash2, Calendar, TrendingUp, Link, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";

const typeColors = {
  daily: "bg-info/10 text-info",
  weekly: "bg-primary/10 text-primary",
  monthly: "bg-secondary/10 text-secondary",
  audit: "bg-warning/10 text-warning",
};

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", type: "weekly", projectId: "", status: "ready" });
  const { teamUser } = useAuth();
  
  // Determine if user has permission to create/edit reports
  const canCreateEditReports = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead' || teamUser?.role === 'Developer';

  const load = async () => {
    setLoading(true);
    try {
      // First, get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      // Check user role
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
      
      let query;
      
      if (userData?.role === 'Developer') {
        // For developers, fetch only reports from assigned projects
        // First, get the project IDs assigned to the user
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
          // No projects assigned to this user
          setReports([]);
          setLoading(false);
          return;
        }
        
        // Extract project IDs
        const projectIds = projectMemberData.map(pm => pm.project_id);
        
        // Then fetch the reports for those projects
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id, 
            title, 
            type, 
            status, 
            project_id, 
            generated_at,
            summary,
            changes,
            improvements,
            drops,
            tasks_completed,
            ranking_trends,
            backlink_updates,
            suggested_priorities
          `)
          .in('project_id', projectIds)
          .order('reports.generated_at', { ascending: false });
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        
        setReports(data || []);
      } else {
        // For other roles, fetch all reports
        query = supabase
          .from("reports")
          .select(`
            id, 
            title, 
            type, 
            status, 
            project_id, 
            generated_at,
            summary,
            changes,
            improvements,
            drops,
            tasks_completed,
            ranking_trends,
            backlink_updates,
            suggested_priorities
          `)
          .order("generated_at", { ascending: false });
      }
      
      const { data, error } = await query;
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setReports(
        (data || []).map((r) => ({
          ...r,
          project: r.project_id,
          generatedAt: r.generated_at,
          highlights: [],
        }))
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load reports");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!form.title) return;
    const { error } = await supabase.from("reports").insert({
      title: form.title,
      type: form.type,
      status: form.status,
      project_id: form.projectId || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ title: "", type: "weekly", projectId: "", status: "ready" });
    load();
  };

  const onDelete = async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    load();
  };

  const generateSampleData = (type: string) => {
    if (type === "daily") {
      return {
        changes: [
          { item: "Homepage SEO meta tags", change: "Added focus keywords" },
          { item: "Blog post: 'SEO Best Practices'", change: "Published new content" },
          { item: "Mobile responsiveness", change: "Fixed viewport issues" }
        ],
        improvements: [
          { metric: "Organic traffic", value: "+12%" },
          { metric: "Page load speed", value: "Improved to 1.8s" },
          { metric: "Bounce rate", value: "Reduced by 8%" }
        ],
        drops: [
          { keyword: "seo tools", position: "Dropped from #3 to #7" },
          { keyword: "digital marketing", position: "Dropped from #5 to #9" }
        ],
        tasks_completed: [
          { title: "Fix broken internal links", status: "Completed" },
          { title: "Optimize image alt texts", status: "Completed" }
        ]
      };
    } else if (type === "weekly") {
      return {
        summary: {
          period: "December 1-7, 2025",
          overview: "Strong week with significant improvements in organic traffic and keyword rankings."
        },
        ranking_trends: [
          { keyword: "seo services", trend: "↑", positions: "+3 (from #12 to #9)" },
          { keyword: "digital marketing agency", trend: "↑", positions: "+2 (from #8 to #6)" },
          { keyword: "ppc management", trend: "↓", positions: "-1 (from #4 to #5)" }
        ],
        backlink_updates: [
          { source: "industryblog.com", type: "New referral link", quality: "High" },
          { source: "forum.example.com", type: "Forum mention", quality: "Medium" }
        ],
        suggested_priorities: [
          { task: "Create content cluster around 'SEO services'", impact: "High" },
          { task: "Improve Core Web Vitals for mobile", impact: "Medium" },
          { task: "Build 5 more high-quality backlinks", impact: "High" }
        ]
      };
    }
    return {};
  };

  const onGenerateSample = async (type: string) => {
    const sampleData = generateSampleData(type);
    const { error } = await supabase.from("reports").insert({
      title: `Sample ${type} report`,
      type: type,
      status: "ready",
      project_id: form.projectId || null,
      ...sampleData
    });
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const exportToPDF = async (id: string) => {
    // In a real implementation, this would generate a PDF
    alert(`Exporting report ${id} to PDF. In a real implementation, this would generate a downloadable PDF.`);
  };

  return (
    <MainLayout>
      <Header title="Reports" subtitle="View automated SEO reports and insights" />

      {canCreateEditReports && (
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm flex-1 min-w-[200px]"
          placeholder="Report title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="audit">Audit</option>
        </select>
        <input
          className="h-10 w-32 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Project ID"
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ready">Ready</option>
          <option value="generating">Generating</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <Button className="rounded-xl" onClick={onCreate}>
          Create
        </Button>
        <Button className="rounded-xl" variant="outline" onClick={() => onGenerateSample(form.type)}>
          Generate Sample {form.type}
        </Button>
      </div>
      )}

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
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.type === 'weekly').length}
              </p>
              <p className="text-sm text-muted-foreground">Weekly Reports</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.type === 'daily').length}
              </p>
              <p className="text-sm text-muted-foreground">Daily Reports</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.status === 'scheduled').length}
              </p>
              <p className="text-sm text-muted-foreground">Scheduled Reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
                    <h3 className="font-semibold">{report.title}</h3>
                    <span className={cn("chip text-xs capitalize", typeColors[report.type as keyof typeof typeColors] ?? "chip")}>
                      {report.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {report.project || "All Projects"} • {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "recent"}
                  </p>
                  
                  {/* Report Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {report.changes && (
                      <div className="border-l-2 border-info pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-info" />
                          <h4 className="font-medium text-sm">What Changed</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.changes.slice(0, 3).map((change: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-info">•</span>
                              <span>{change.item}: {change.change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {report.improvements && (
                      <div className="border-l-2 border-success pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <h4 className="font-medium text-sm">What Improved</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.improvements.slice(0, 3).map((improvement: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-success">•</span>
                              <span>{improvement.metric}: {improvement.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {report.drops && (
                      <div className="border-l-2 border-destructive pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-destructive rotate-180" />
                          <h4 className="font-medium text-sm">What Dropped</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.drops.slice(0, 3).map((drop: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-destructive">•</span>
                              <span>{drop.keyword}: {drop.position}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {report.tasks_completed && (
                      <div className="border-l-2 border-primary pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-sm">Tasks Completed</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.tasks_completed.slice(0, 3).map((task: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{task.title}: {task.status}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {report.ranking_trends && (
                      <div className="border-l-2 border-primary pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-sm">Ranking Trends</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.ranking_trends.slice(0, 3).map((trend: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{trend.keyword} {trend.trend} {trend.positions}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {report.backlink_updates && (
                      <div className="border-l-2 border-secondary pl-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Link className="w-4 h-4 text-secondary" />
                          <h4 className="font-medium text-sm">Backlink Updates</h4>
                        </div>
                        <ul className="text-xs space-y-1">
                          {report.backlink_updates.slice(0, 3).map((backlink: any, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-secondary">•</span>
                              <span>{backlink.source}: {backlink.type} ({backlink.quality})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report.status === "ready" && (
                  <>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => exportToPDF(report.id)}>
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </>
                )}
                {report.status === "generating" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                )}
                {canCreateEditReports && (
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(report.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}