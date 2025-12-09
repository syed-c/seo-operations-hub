import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, Minus, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const intentColors = {
  informational: "bg-info/10 text-info",
  transactional: "bg-success/10 text-success",
  navigational: "bg-primary/10 text-primary",
  commercial: "bg-warning/10 text-warning",
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty < 40) return "text-success";
  if (difficulty < 70) return "text-warning";
  return "text-destructive";
};

export default function Keywords() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ 
    term: "", 
    intent: "informational", 
    difficulty: 40, 
    volume: 0, 
    targetPosition: 10, 
    tags: [],
    projectId: "", 
    pageId: "" 
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("keywords")
        .select(`
          id, 
          term, 
          intent, 
          difficulty_score, 
          volume, 
          target_position,
          tags,
          last_checked,
          project_id, 
          page_id, 
keyword_rankings!keyword_id(position, recorded_at)
        `)
        .order("created_at", { ascending: false })
        .order("recorded_at", { ascending: false, foreignTable: "keyword_rankings!keyword_id" })
        .limit(1, { foreignTable: "keyword_rankings!keyword_id" });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setKeywords(
        (data || []).map((k) => ({
          id: k.id,
          keyword: k.term,
          intent: k.intent,
          difficulty: k.difficulty_score ?? 0,
          difficultyScore: k.difficulty_score ?? null,
          lastDifficultyCheck: k.last_difficulty_check ?? null,
          volume: k.volume ?? 0,
          targetPosition: k.target_position ?? 10,
          tags: k.tags ?? [],
          lastChecked: k.last_checked ?? "",
          project: k.project_id,
          page: k.page_id,
          position: k.keyword_rankings?.position ?? 0,
          recordedAt: k.keyword_rankings?.recorded_at ?? ","
        }))
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load keywords");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!form.term || !form.projectId) return;
    const { error } = await supabase.from("keywords").insert({
      term: form.term,
      intent: form.intent,
      difficulty_score: form.difficulty,
      volume: form.volume,
      target_position: form.targetPosition,
      tags: form.tags,
      last_checked: new Date().toISOString(),
      project_id: form.projectId,
      page_id: form.pageId || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ term: "", intent: "informational", difficulty: 40, volume: 0, projectId: "", pageId: "" });
    load();
  };

  const onDelete = async (id: string) => {
    await supabase.from("keywords").delete().eq("id", id);
    load();
  };

  const recalculateDifficulty = async (id: string) => {
    // In a real implementation, this would call the keyword-difficulty function
    // For now, we'll just show a message
    alert(`Recalculating difficulty for keyword ${id}`);
    // You would typically call an API endpoint that triggers the keyword-difficulty function
  };

  return (
    <MainLayout>
      <Header title="Keywords" subtitle="Track and analyze keyword performance across all projects" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search keywords..."
              className="w-72 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Keyword"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
          />
          <input
            className="h-10 w-24 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project ID"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          />
          <input
            className="h-10 w-24 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Page ID (opt)"
            value={form.pageId}
            onChange={(e) => setForm({ ...form, pageId: e.target.value })}
          />
          <input
            type="number"
            className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Vol"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: Number(e.target.value) })}
          />
          <input
            type="number"
            className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Diff"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
          />
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={form.intent}
            onChange={(e) => setForm({ ...form, intent: e.target.value })}
          >
            <option value="informational">informational</option>
            <option value="commercial">commercial</option>
            <option value="transactional">transactional</option>
            <option value="navigational">navigational</option>
          </select>
          <Button className="gap-2 rounded-xl" onClick={onCreate}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-2">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      <div className="glass-card overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Keyword <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Position</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Volume</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Target</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Intent</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Tags</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Page</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, index) => {
                const positionChange = kw.previousPosition - kw.position;
                return (
                  <tr
                    key={kw.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4">
                      <p className="font-medium text-sm">{kw.keyword}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">{kw.project || "—"}</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-lg">{kw.position}</span>
                        {positionChange > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-success">
                            <TrendingUp className="w-3.5 h-3.5" />+{positionChange}
                          </span>
                        )}
                        {positionChange < 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-destructive">
                            <TrendingDown className="w-3.5 h-3.5" />{positionChange}
                          </span>
                        )}
                        {positionChange === 0 && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm">{kw.volume.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        {kw.difficultyScore !== null ? (
                          <span className={cn("text-sm font-medium", getDifficultyColor(kw.difficultyScore))}>
                            {kw.difficultyScore}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                        <button 
                          className="text-xs text-primary hover:underline mt-1"
                          onClick={() => recalculateDifficulty(kw.id)}
                        >
                          Recalculate
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-medium text-info">
                        {kw.targetPosition ? `#${kw.targetPosition}` : "—"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("chip text-xs capitalize", intentColors[kw.intent as keyof typeof intentColors] ?? "chip")}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {kw.tags && kw.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {kw.tags.slice(0, 2).map((tag: string, index: number) => (
                            <span key={index} className="text-xs px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                              {tag}
                            </span>
                          ))}
                          {kw.tags.length > 2 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              +{kw.tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline mx-auto">
                        {kw.page || "—"} <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                        onClick={() => onDelete(kw.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
