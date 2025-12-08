import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Globe, Plus, Search, Filter, MoreVertical, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

type ProjectRecord = {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
};

const statusColors = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  critical: "bg-destructive/10 text-destructive",
};

export default function Projects() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [health, setHealth] = useState(70);
  const [status, setStatus] = useState("active");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client, status, health_score, created_at")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setProjects(data || []);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load projects");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!name) return;
    const { error } = await supabase.from("projects").insert({
      name,
      client,
      status,
      health_score: health,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setClient("");
    setHealth(70);
    setStatus("active");
    load();
  };

  const onDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    load();
  };

  const onUpdate = async (p: ProjectRecord) => {
    await supabase
      .from("projects")
      .update({ status: p.status, health_score: p.health_score, client: p.client, name: p.name })
      .eq("id", p.id);
    load();
  };

  const filtered = useMemo(() => projects, [projects]);

  return (
    <MainLayout>
      <Header title="Projects" subtitle="Manage all your SEO projects in one place" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-64 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Client / Domain"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <input
            type="number"
            className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Health"
            value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
          />
          <Button className="gap-2 rounded-xl" onClick={onCreate}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-5">
        {filtered.map((project, index) => (
          <div
            key={project.id}
            className="glass-card p-5 animate-slide-up hover:shadow-card-hover transition-all cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <input
                    className="font-semibold bg-transparent outline-none"
                    value={project.name}
                    onChange={(e) => setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, name: e.target.value } : p)))}
                  />
                  <input
                    className="text-sm text-muted-foreground bg-transparent outline-none"
                    value={project.client ?? ""}
                    onChange={(e) => setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, client: e.target.value } : p)))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className={cn("chip text-xs capitalize bg-muted text-foreground")}
                  value={project.status ?? "active"}
                  onChange={(e) =>
                    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, status: e.target.value } : p)))
                  }
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                  <option value="critical">critical</option>
                </select>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(project.id)}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <input
                  type="number"
                  className="text-sm font-semibold w-20 bg-transparent outline-none"
                  value={project.health_score ?? 0}
                  onChange={(e) =>
                    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, health_score: Number(e.target.value) } : p)))
                  }
                />
              </div>
              <Progress
                value={project.health_score ?? 0}
                className="h-2"
                indicatorClassName={cn(
                  (project.health_score ?? 0) >= 80 && "bg-success",
                  (project.health_score ?? 0) >= 60 && (project.health_score ?? 0) < 80 && "bg-warning",
                  (project.health_score ?? 0) < 60 && "bg-destructive"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Backlinks</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-semibold">—</p>
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  <Avatar className="w-7 h-7 border-2 border-card">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" />
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onUpdate(project)}>
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
