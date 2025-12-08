import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { FileText, Download, Clock, BarChart3, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

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

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, title, type, status, project_id, generated_at")
        .order("generated_at", { ascending: false });
      
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

  return (
    <MainLayout>
      <Header title="Reports" subtitle="View automated SEO reports and insights" />

      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Report title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="daily">daily</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
          <option value="audit">audit</option>
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
          <option value="ready">ready</option>
          <option value="generating">generating</option>
          <option value="scheduled">scheduled</option>
        </select>
        <Button className="rounded-xl" onClick={onCreate}>
          Create
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-3">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid grid-cols-4 gap-4 mb-6">
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
              <p className="text-2xl font-bold">—</p>
              <p className="text-sm text-muted-foreground">Audits This Month</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-sm text-muted-foreground">AI Insights</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{report.title}</h3>
                    <span className={cn("chip text-xs capitalize", typeColors[report.type as keyof typeof typeColors] ?? "chip")}>
                      {report.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.project || "All Projects"} • {report.generatedAt || "recent"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report.status === "ready" && (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
                {report.status === "generating" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                )}
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(report.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

